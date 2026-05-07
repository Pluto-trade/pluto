use anchor_lang::prelude::*;

use crate::errors::ExchangeError;
use crate::states::{
    CustodyVault, EscrowPosition, EscrowStatus, ExchangeConfig, OrderSide, OrderState, OrderStatus,
    OrderType, UserBalance, UserProfile, ORDER_ID_MAX_LEN, SYMBOL_MAX_LEN,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PlaceOrderArgs {
    pub order_id: String,
    pub symbol: String,
    pub side: OrderSide,
    pub order_type: OrderType,
    pub price: u64,
    pub quantity: u64,
}

#[derive(Accounts)]
#[instruction(args: PlaceOrderArgs)]
pub struct PlaceOrder<'info> {
    #[account(
        mut,
        seeds = [b"exchange"],
        bump = exchange.bump
    )]
    pub exchange: Account<'info, ExchangeConfig>,

    #[account(
        seeds = [b"user", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.authority == user.key() @ ExchangeError::InvalidUser
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(
        init,
        payer = user,
        space = OrderState::SPACE,
        seeds = [b"order", user.key().as_ref(), args.order_id.as_bytes()],
        bump
    )]
    pub order: Account<'info, OrderState>,

    #[account(
        init,
        payer = user,
        space = EscrowPosition::SPACE,
        seeds = [b"escrow", user.key().as_ref(), args.order_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, EscrowPosition>,

    #[account(
        mut,
        seeds = [b"user-balance", user.key().as_ref(), token_mint.key().as_ref()],
        bump = user_balance.bump,
        constraint = user_balance.owner == user.key() @ ExchangeError::InvalidUser,
        constraint = user_balance.token_mint == token_mint.key() @ ExchangeError::InvalidMint
    )]
    pub user_balance: Account<'info, UserBalance>,

    #[account(
        mut,
        seeds = [b"custody", token_mint.key().as_ref()],
        bump = custody_vault.bump,
        constraint = custody_vault.token_mint == token_mint.key() @ ExchangeError::InvalidMint
    )]
    pub custody_vault: Account<'info, CustodyVault>,

    /// CHECK: Only used as the mint key for PDA/accounting validation.
    pub token_mint: AccountInfo<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<PlaceOrder>, args: PlaceOrderArgs) -> Result<()> {
    require!(
        !ctx.accounts.exchange.is_paused,
        ExchangeError::ExchangePaused
    );
    require!(args.quantity > 0, ExchangeError::InvalidAmount);
    require!(args.price > 0, ExchangeError::InvalidAmount);
    require!(
        args.order_id.len() <= ORDER_ID_MAX_LEN && args.symbol.len() <= SYMBOL_MAX_LEN,
        ExchangeError::StringTooLong
    );

    let locked_amount = match args.side {
        OrderSide::Buy => args
            .price
            .checked_mul(args.quantity)
            .ok_or(ExchangeError::MathOverflow)?,
        OrderSide::Sell => args.quantity,
    };

    require!(
        ctx.accounts.user_balance.available_amount >= locked_amount,
        ExchangeError::InsufficientAvailableBalance
    );

    let now = Clock::get()?.unix_timestamp;
    let exchange = &mut ctx.accounts.exchange;

    exchange.order_sequence = exchange
        .order_sequence
        .checked_add(1)
        .ok_or(ExchangeError::MathOverflow)?;

    let order = &mut ctx.accounts.order;
    order.owner = ctx.accounts.user.key();
    order.order_id = args.order_id.clone();
    order.symbol = args.symbol;
    order.side = args.side;
    order.order_type = args.order_type;
    order.status = match args.order_type {
        OrderType::Limit => OrderStatus::Resting,
        OrderType::Market => OrderStatus::Accepted,
    };
    order.price = args.price;
    order.quantity = args.quantity;
    order.filled_quantity = 0;
    order.remaining_quantity = args.quantity;
    order.sequence_id = exchange.order_sequence;
    order.created_at = now;
    order.updated_at = now;
    order.bump = ctx.bumps.order;

    let user_balance = &mut ctx.accounts.user_balance;
    user_balance.available_amount = user_balance
        .available_amount
        .checked_sub(locked_amount)
        .ok_or(ExchangeError::MathOverflow)?;
    user_balance.locked_amount = user_balance
        .locked_amount
        .checked_add(locked_amount)
        .ok_or(ExchangeError::MathOverflow)?;

    let escrow = &mut ctx.accounts.escrow;
    escrow.owner = ctx.accounts.user.key();
    escrow.token_mint = ctx.accounts.token_mint.key();
    escrow.order_id = args.order_id;
    escrow.side = args.side;
    escrow.status = EscrowStatus::Locked;
    escrow.locked_amount = locked_amount;
    escrow.released_amount = 0;
    escrow.cancelled_amount = 0;
    escrow.created_at = now;
    escrow.updated_at = now;
    escrow.bump = ctx.bumps.escrow;

    let custody_vault = &mut ctx.accounts.custody_vault;
    custody_vault.total_locked = custody_vault
        .total_locked
        .checked_add(locked_amount)
        .ok_or(ExchangeError::MathOverflow)?;

    Ok(())
}
