use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::states::CustodyVault;

#[derive(Accounts)]
pub struct InitializeCustody<'info> {
    #[account(
        init,
        payer = authority,
        space = CustodyVault::SPACE,
        seeds = [b"custody", token_mint.key().as_ref()],
        bump,
    )]
    pub custody_vault: Account<'info, CustodyVault>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = custody_vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeCustody>) -> Result<()> {
    let custody_vault = &mut ctx.accounts.custody_vault;
    custody_vault.authority = ctx.accounts.authority.key();
    custody_vault.token_mint = ctx.accounts.token_mint.key();
    custody_vault.token_vault = ctx.accounts.vault_token_account.key();
    custody_vault.total_deposited = 0;
    custody_vault.total_withdrawn = 0;
    custody_vault.total_locked = 0;
    custody_vault.bump = ctx.bumps.custody_vault;

    Ok(())
}
