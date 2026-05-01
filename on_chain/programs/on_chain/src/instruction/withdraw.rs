use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::ExchangeError;
use crate::states::{CustodyVault, UserBalance, UserProfile};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        seeds = [b"user", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.authority == user.key() @ ExchangeError::InvalidUser
    )]
    pub user_profile: Account<'info, UserProfile>,

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
        constraint = custody_vault.token_mint == token_mint.key() @ ExchangeError::InvalidMint,
        constraint = custody_vault.token_vault == vault_token_account.key() @ ExchangeError::InvalidVault
    )]
    pub custody_vault: Account<'info, CustodyVault>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = vault_token_account.owner == custody_vault.key() @ ExchangeError::InvalidVault,
        constraint = vault_token_account.mint == token_mint.key() @ ExchangeError::InvalidMint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ ExchangeError::InvalidUser,
        constraint = user_token_account.mint == token_mint.key() @ ExchangeError::InvalidMint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, ExchangeError::InvalidAmount);
    require!(
        ctx.accounts.user_balance.available_amount >= amount,
        ExchangeError::InsufficientAvailableBalance
    );

    let token_mint_key = ctx.accounts.token_mint.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"custody",
        token_mint_key.as_ref(),
        &[ctx.accounts.custody_vault.bump],
    ]];

    let transfer_accounts = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.custody_vault.to_account_info(),
    };

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        transfer_accounts,
        signer_seeds,
    );

    token::transfer(transfer_ctx, amount)?;

    let user_balance = &mut ctx.accounts.user_balance;

    user_balance.available_amount = user_balance
        .available_amount
        .checked_sub(amount)
        .ok_or(ExchangeError::MathOverflow)?;

    user_balance.withdrawn_amount = user_balance
        .withdrawn_amount
        .checked_add(amount)
        .ok_or(ExchangeError::MathOverflow)?;

    let custody_vault = &mut ctx.accounts.custody_vault;

    custody_vault.total_withdrawn = custody_vault
        .total_withdrawn
        .checked_add(amount)
        .ok_or(ExchangeError::MathOverflow)?;

    Ok(())
}
