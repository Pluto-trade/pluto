use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod states;

pub use errors::*;
pub use events::*;
pub use states::*;

declare_id!("3ay1oBhMWfjNzKNPQcj7KACKsDq7yAMg9T12dYGmHwyU");

#[program]
pub mod on_chain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
