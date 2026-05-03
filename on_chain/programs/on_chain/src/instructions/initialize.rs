use anchor_lang::prelude::*;
use crate::states::ExchangeConfig;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = ExchangeConfig::SPACE,
        seeds = [b"exchange"],
        bump,
    )]
    pub config: Account<'info, ExchangeConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
    let config = &mut ctx.accounts.config;

    config.authority = ctx.accounts.authority.key();
    config.fee_bps = fee_bps;
    config.order_sequence = 0;
    config.is_paused = false;
    config.bump = ctx.bumps.config;
    Ok(())
}
