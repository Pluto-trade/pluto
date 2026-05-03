use anchor_lang::prelude::*;

use crate::errors::ExchangeError;
use crate::states::{
    CustodyVault, EscrowPosition, EscrowStatus, OrderSide, OrderState, OrderStatus,
    SettlementStatus, TradeSettlement, UserBalance, UserProfile, SYMBOL_MAX_LEN, TRADE_ID_MAX_LEN,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SettleTradeArgs {
    pub trade_id: String,
    pub symbol: String,
    pub price: u64,
    pub quantity: u64,
}

#[derive(Accounts)]
#[instruction(args: SettleTradeArgs)]
pub struct SettleTrade<'info> {
    // Buyer's accounts
    #[account(
        seeds = [b"user", buyer.key().as_ref()],
        bump = buyer_profile.bump,
        constraint = buyer_profile.authority == buyer.key() @ ExchangeError::InvalidUser
    )]
    pub buyer_profile: Box<Account<'info, UserProfile>>,

    #[account(
        mut,
        seeds = [b"order", buyer.key().as_ref(), buyer_order.order_id.as_bytes()],
        bump = buyer_order.bump,
        constraint = buyer_order.owner == buyer.key() @ ExchangeError::InvalidUser,
        constraint = buyer_order.side == OrderSide::Buy @ ExchangeError::InvalidOrderStatus
    )]
    pub buyer_order: Box<Account<'info, OrderState>>,

    #[account(
        mut,
        seeds = [b"escrow", buyer.key().as_ref(), buyer_escrow.order_id.as_bytes()],
        bump = buyer_escrow.bump,
        constraint = buyer_escrow.owner == buyer.key() @ ExchangeError::InvalidUser,
        constraint = buyer_escrow.side == OrderSide::Buy @ ExchangeError::InvalidEscrowStatus
    )]
    pub buyer_escrow: Box<Account<'info, EscrowPosition>>,

    #[account(
        mut,
        seeds = [b"user-balance", buyer.key().as_ref(), base_mint.key().as_ref()],
        bump = buyer_balance.bump,
        constraint = buyer_balance.owner == buyer.key() @ ExchangeError::InvalidUser,
        constraint = buyer_balance.token_mint == base_mint.key() @ ExchangeError::InvalidMint
    )]
    pub buyer_balance: Box<Account<'info, UserBalance>>,

    // Seller's accounts
    #[account(
        seeds = [b"user", seller.key().as_ref()],
        bump = seller_profile.bump,
        constraint = seller_profile.authority == seller.key() @ ExchangeError::InvalidUser
    )]
    pub seller_profile: Box<Account<'info, UserProfile>>,

    /// CHECK: Used only to derive and validate seller-owned PDAs.
    pub seller: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"order", seller.key().as_ref(), seller_order.order_id.as_bytes()],
        bump = seller_order.bump,
        constraint = seller_order.owner == seller.key() @ ExchangeError::InvalidUser,
        constraint = seller_order.side == OrderSide::Sell @ ExchangeError::InvalidOrderStatus
    )]
    pub seller_order: Box<Account<'info, OrderState>>,

    #[account(
        mut,
        seeds = [b"escrow", seller.key().as_ref(), seller_escrow.order_id.as_bytes()],
        bump = seller_escrow.bump,
        constraint = seller_escrow.owner == seller.key() @ ExchangeError::InvalidUser,
        constraint = seller_escrow.side == OrderSide::Sell @ ExchangeError::InvalidEscrowStatus
    )]
    pub seller_escrow: Box<Account<'info, EscrowPosition>>,

    #[account(
        mut,
        seeds = [b"user-balance", seller.key().as_ref(), quote_mint.key().as_ref()],
        bump = seller_balance.bump,
        constraint = seller_balance.owner == seller.key() @ ExchangeError::InvalidUser,
        constraint = seller_balance.token_mint == quote_mint.key() @ ExchangeError::InvalidMint
    )]
    pub seller_balance: Box<Account<'info, UserBalance>>,

    // Token mints
    pub base_mint: Box<Account<'info, anchor_spl::token::Mint>>,
    pub quote_mint: Box<Account<'info, anchor_spl::token::Mint>>,

    // Custody vaults for token transfers
    #[account(
        mut,
        seeds = [b"custody", base_mint.key().as_ref()],
        bump = base_custody.bump,
        constraint = base_custody.token_mint == base_mint.key() @ ExchangeError::InvalidMint
    )]
    pub base_custody: Box<Account<'info, CustodyVault>>,

    #[account(
        mut,
        seeds = [b"custody", quote_mint.key().as_ref()],
        bump = quote_custody.bump,
        constraint = quote_custody.token_mint == quote_mint.key() @ ExchangeError::InvalidMint
    )]
    pub quote_custody: Box<Account<'info, CustodyVault>>,

    // Trade settlement record
    #[account(
        init,
        payer = payer,
        space = TradeSettlement::SPACE,
        seeds = [b"settlement", args.trade_id.as_bytes()],
        bump
    )]
    pub trade_settlement: Box<Account<'info, TradeSettlement>>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SettleTrade>, args: SettleTradeArgs) -> Result<()> {
    // Validate inputs
    require!(args.quantity > 0, ExchangeError::InvalidAmount);
    require!(args.price > 0, ExchangeError::InvalidAmount);
    require!(
        args.trade_id.len() <= TRADE_ID_MAX_LEN && args.symbol.len() <= SYMBOL_MAX_LEN,
        ExchangeError::StringTooLong
    );

    // Verify orders match the trade
    require!(
        ctx.accounts.buyer_order.symbol == args.symbol,
        ExchangeError::InvalidOrderStatus
    );
    require!(
        ctx.accounts.seller_order.symbol == args.symbol,
        ExchangeError::InvalidOrderStatus
    );
    require!(
        ctx.accounts.buyer_order.price >= args.price,
        ExchangeError::InvalidOrderStatus
    );
    require!(
        ctx.accounts.seller_order.price <= args.price,
        ExchangeError::InvalidOrderStatus
    );

    // Verify orders are in a state that can be filled
    require!(
        matches!(
            ctx.accounts.buyer_order.status,
            OrderStatus::Resting
                | OrderStatus::Accepted
                | OrderStatus::PartiallyFilled
        ),
        ExchangeError::InvalidOrderStatus
    );
    require!(
        matches!(
            ctx.accounts.seller_order.status,
            OrderStatus::Resting
                | OrderStatus::Accepted
                | OrderStatus::PartiallyFilled
        ),
        ExchangeError::InvalidOrderStatus
    );

    // Verify escrows are in a state that can be released
    require!(
        matches!(
            ctx.accounts.buyer_escrow.status,
            EscrowStatus::Locked | EscrowStatus::PartiallyReleased
        ),
        ExchangeError::InvalidEscrowStatus
    );
    require!(
        matches!(
            ctx.accounts.seller_escrow.status,
            EscrowStatus::Locked | EscrowStatus::PartiallyReleased
        ),
        ExchangeError::InvalidEscrowStatus
    );

    let now = Clock::get()?.unix_timestamp;

    // Calculate amounts
    let quote_amount = args
        .price
        .checked_mul(args.quantity)
        .ok_or(ExchangeError::MathOverflow)?;

    // ===== Update Buyer =====
    // Buyer releases locked quote tokens (they got base tokens)
    let buyer_order = &mut ctx.accounts.buyer_order;
    buyer_order.filled_quantity = buyer_order
        .filled_quantity
        .checked_add(args.quantity)
        .ok_or(ExchangeError::MathOverflow)?;
    buyer_order.remaining_quantity = buyer_order
        .remaining_quantity
        .checked_sub(args.quantity)
        .ok_or(ExchangeError::MathOverflow)?;
    buyer_order.status = if buyer_order.remaining_quantity == 0 {
        OrderStatus::Filled
    } else {
        OrderStatus::PartiallyFilled
    };
    buyer_order.updated_at = now;

    let buyer_escrow = &mut ctx.accounts.buyer_escrow;
    buyer_escrow.released_amount = buyer_escrow
        .released_amount
        .checked_add(quote_amount)
        .ok_or(ExchangeError::MathOverflow)?;
    buyer_escrow.status = if buyer_escrow.released_amount == buyer_escrow.locked_amount {
        EscrowStatus::Released
    } else {
        EscrowStatus::PartiallyReleased
    };
    buyer_escrow.updated_at = now;

    // Buyer receives base tokens (add to available)
    let buyer_balance = &mut ctx.accounts.buyer_balance;
    buyer_balance.available_amount = buyer_balance
        .available_amount
        .checked_add(args.quantity)
        .ok_or(ExchangeError::MathOverflow)?;
    buyer_balance.locked_amount = buyer_balance
        .locked_amount
        .checked_sub(quote_amount)
        .ok_or(ExchangeError::MathOverflow)?;

    // ===== Update Seller =====
    // Seller releases locked base tokens (they got quote tokens)
    let seller_order = &mut ctx.accounts.seller_order;
    seller_order.filled_quantity = seller_order
        .filled_quantity
        .checked_add(args.quantity)
        .ok_or(ExchangeError::MathOverflow)?;
    seller_order.remaining_quantity = seller_order
        .remaining_quantity
        .checked_sub(args.quantity)
        .ok_or(ExchangeError::MathOverflow)?;
    seller_order.status = if seller_order.remaining_quantity == 0 {
        OrderStatus::Filled
    } else {
        OrderStatus::PartiallyFilled
    };
    seller_order.updated_at = now;

    let seller_escrow = &mut ctx.accounts.seller_escrow;
    seller_escrow.released_amount = seller_escrow
        .released_amount
        .checked_add(args.quantity)
        .ok_or(ExchangeError::MathOverflow)?;
    seller_escrow.status = if seller_escrow.released_amount == seller_escrow.locked_amount {
        EscrowStatus::Released
    } else {
        EscrowStatus::PartiallyReleased
    };
    seller_escrow.updated_at = now;

    // Seller receives quote tokens (add to available)
    let seller_balance = &mut ctx.accounts.seller_balance;
    seller_balance.available_amount = seller_balance
        .available_amount
        .checked_add(quote_amount)
        .ok_or(ExchangeError::MathOverflow)?;
    seller_balance.locked_amount = seller_balance
        .locked_amount
        .checked_sub(args.quantity)
        .ok_or(ExchangeError::MathOverflow)?;

    // ===== Update Custody Vaults =====
    let base_custody = &mut ctx.accounts.base_custody;
    base_custody.total_locked = base_custody
        .total_locked
        .checked_sub(args.quantity)
        .ok_or(ExchangeError::MathOverflow)?;

    let quote_custody = &mut ctx.accounts.quote_custody;
    quote_custody.total_locked = quote_custody
        .total_locked
        .checked_sub(quote_amount)
        .ok_or(ExchangeError::MathOverflow)?;

    // ===== Create Trade Settlement Record =====
    let trade_settlement = &mut ctx.accounts.trade_settlement;
    trade_settlement.trade_id = args.trade_id;
    trade_settlement.symbol = args.symbol;
    trade_settlement.buy_order_id = ctx.accounts.buyer_order.order_id.clone();
    trade_settlement.sell_order_id = ctx.accounts.seller_order.order_id.clone();
    trade_settlement.maker_order_id = if ctx.accounts.buyer_order.sequence_id
        < ctx.accounts.seller_order.sequence_id
    {
        ctx.accounts.buyer_order.order_id.clone()
    } else {
        ctx.accounts.seller_order.order_id.clone()
    };
    trade_settlement.taker_order_id = if ctx.accounts.buyer_order.sequence_id
        < ctx.accounts.seller_order.sequence_id
    {
        ctx.accounts.seller_order.order_id.clone()
    } else {
        ctx.accounts.buyer_order.order_id.clone()
    };
    trade_settlement.buyer = ctx.accounts.buyer.key();
    trade_settlement.seller = ctx.accounts.seller_profile.authority;
    trade_settlement.base_mint = ctx.accounts.base_mint.key();
    trade_settlement.quote_mint = ctx.accounts.quote_mint.key();
    trade_settlement.price = args.price;
    trade_settlement.quantity = args.quantity;
    trade_settlement.quote_amount = quote_amount;
    trade_settlement.status = SettlementStatus::Settled;
    trade_settlement.executed_at = now;
    trade_settlement.settled_at = now;
    trade_settlement.bump = ctx.bumps.trade_settlement;

    Ok(())
}
