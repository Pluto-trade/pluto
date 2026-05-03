use anchor_lang::prelude::*;

use crate::errors::ExchangeError;
use crate::states::{
    CustodyVault, EscrowPosition, EscrowStatus, OrderState, OrderStatus, UserBalance, UserProfile,
};

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(
        seeds = [b"user", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.authority == user.key() @ ExchangeError::InvalidUser
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [b"order", user.key().as_ref(), order.order_id.as_bytes()],
        bump = order.bump,
        constraint = order.owner == user.key() @ ExchangeError::InvalidUser
    )]
    pub order: Account<'info, OrderState>,

    #[account(
        mut,
        seeds = [b"escrow", user.key().as_ref(), escrow.order_id.as_bytes()],
        bump = escrow.bump,
        constraint = escrow.owner == user.key() @ ExchangeError::InvalidUser
    )]
    pub escrow: Account<'info, EscrowPosition>,

    #[account(
        mut,
        seeds = [b"user-balance", user.key().as_ref(), escrow.token_mint.as_ref()],
        bump = user_balance.bump,
        constraint = user_balance.owner == user.key() @ ExchangeError::InvalidUser,
        constraint = user_balance.token_mint == escrow.token_mint @ ExchangeError::InvalidMint
    )]
    pub user_balance: Account<'info, UserBalance>,

    #[account(
        mut,
        seeds = [b"custody", escrow.token_mint.as_ref()],
        bump = custody_vault.bump,
        constraint = custody_vault.token_mint == escrow.token_mint @ ExchangeError::InvalidMint
    )]
    pub custody_vault: Account<'info, CustodyVault>,

    #[account(mut)]
    pub user: Signer<'info>,
}

pub fn handler(ctx: Context<CancelOrder>) -> Result<()> {
    require!(
        matches!(
            ctx.accounts.order.status,
            OrderStatus::Resting | OrderStatus::PartiallyFilled | OrderStatus::Accepted
        ),
        ExchangeError::InvalidOrderStatus
    );
    require!(
        matches!(
            ctx.accounts.escrow.status,
            EscrowStatus::Locked | EscrowStatus::PartiallyReleased
        ),
        ExchangeError::InvalidEscrowStatus
    );
    require!(
        ctx.accounts.order.order_id == ctx.accounts.escrow.order_id,
        ExchangeError::InvalidOrderStatus
    );

    let locked_remaining = ctx
        .accounts
        .escrow
        .locked_amount
        .checked_sub(ctx.accounts.escrow.released_amount)
        .ok_or(ExchangeError::MathOverflow)?
        .checked_sub(ctx.accounts.escrow.cancelled_amount)
        .ok_or(ExchangeError::MathOverflow)?;

    let now = Clock::get()?.unix_timestamp;

    let order = &mut ctx.accounts.order;
    order.status = OrderStatus::Cancelled;
    order.remaining_quantity = 0;
    order.updated_at = now;

    let escrow = &mut ctx.accounts.escrow;
    escrow.status = EscrowStatus::Cancelled;
    escrow.cancelled_amount = escrow
        .cancelled_amount
        .checked_add(locked_remaining)
        .ok_or(ExchangeError::MathOverflow)?;
    escrow.updated_at = now;

    let user_balance = &mut ctx.accounts.user_balance;
    user_balance.locked_amount = user_balance
        .locked_amount
        .checked_sub(locked_remaining)
        .ok_or(ExchangeError::MathOverflow)?;
    user_balance.available_amount = user_balance
        .available_amount
        .checked_add(locked_remaining)
        .ok_or(ExchangeError::MathOverflow)?;

    let custody_vault = &mut ctx.accounts.custody_vault;
    custody_vault.total_locked = custody_vault
        .total_locked
        .checked_sub(locked_remaining)
        .ok_or(ExchangeError::MathOverflow)?;

    Ok(())
}
