use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::ExchangeError;
use crate::states::{CustodyVault, UserBalance, UserProfile};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        seeds = [b"user", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.authority == user.key() @ ExchangeError::InvalidUser
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserBalance::SPACE,
        seeds = [b"user-balance", user.key().as_ref(), token_mint.key().as_ref()],
        bump
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
        constraint = user_token_account.owner == user.key() @ ExchangeError::InvalidUser,
        constraint = user_token_account.mint == token_mint.key() @ ExchangeError::InvalidMint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.mint == token_mint.key() @ ExchangeError::InvalidMint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, ExchangeError::InvalidAmount);

    let transfer_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };

    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        transfer_accounts,
    );

    token::transfer(transfer_ctx, amount)?;

    let user_balance = &mut ctx.accounts.user_balance;
//this block runs for when the account is created for the first time 
    if user_balance.owner == Pubkey::default() {
        user_balance.owner = ctx.accounts.user.key();
        user_balance.token_mint = ctx.accounts.token_mint.key();
        user_balance.available_amount = 0;
        user_balance.locked_amount = 0;
        user_balance.deposited_amount = 0;
        user_balance.withdrawn_amount = 0;
        user_balance.bump = ctx.bumps.user_balance;
    }

    require!(
        user_balance.owner == ctx.accounts.user.key(),
        ExchangeError::InvalidUser
    );
    require!(
        user_balance.token_mint == ctx.accounts.token_mint.key(),
        ExchangeError::InvalidMint
    );

    user_balance.available_amount = user_balance
        .available_amount
        .checked_add(amount)
        .ok_or(ExchangeError::MathOverflow)?;

    user_balance.deposited_amount = user_balance
        .deposited_amount
        .checked_add(amount)
        .ok_or(ExchangeError::MathOverflow)?;

    let custody_vault = &mut ctx.accounts.custody_vault;

    custody_vault.total_deposited = custody_vault
        .total_deposited
        .checked_add(amount)
        .ok_or(ExchangeError::MathOverflow)?;

    Ok(())
}
