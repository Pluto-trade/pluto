use anchor_lang::prelude::*;

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub created_at: i64,
    pub bump: u8,
}

impl UserProfile {
    pub const SPACE: usize = 8 + 32 + 8 + 1;
}
