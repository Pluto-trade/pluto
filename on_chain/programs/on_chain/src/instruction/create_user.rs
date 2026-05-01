use anchor_lang::prelude::*;
use crate::states::UserProfile,
#[derive(Accounts)]
pub struct CreateUser<'info>{
    #[account(
        init,
        payer=user,
        space=UserProfile::LEN,
        seeds=[b"user",user.key().as_ref()],
        bump,
    )]
    pub user_profile:Account<'info,UserProfile>
    #[account(mut)]
    pub user:Signer<'info>,
    pub system_program: program<'info, System>,
}
pub fn handler(ctx: Context<CreateUser>) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    user_profile.authority = ctx.accounts.user.key();
    user_profile.created_at = Clock::get()?.unix_timestamp;
    user_profile.bump = ctx.bumps.user_profile;

    Ok(())
}