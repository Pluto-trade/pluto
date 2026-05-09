use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod states;

pub use errors::*;
pub use events::*;
pub use instructions::*;
pub use states::*;

declare_id!("Paa6shBbKzD3BW3TMzUShJRVcriAANrb5PFpXYpuQKZ");

#[program]
pub mod on_chain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
        instructions::initialize::handler(ctx, fee_bps)
    }

    pub fn create_user(ctx: Context<CreateUser>) -> Result<()> {
        instructions::create_user::handler(ctx)
    }

    pub fn initialize_custody(ctx: Context<InitializeCustody>) -> Result<()> {
        instructions::initialize_custody::handler(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }

    pub fn place_order(ctx: Context<PlaceOrder>, args: PlaceOrderArgs) -> Result<()> {
        instructions::place_order::handler(ctx, args)
    }

    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        instructions::cancel_order::handler(ctx)
    }

    pub fn settle_trade(ctx: Context<SettleTrade>, args: SettleTradeArgs) -> Result<()> {
        instructions::settle_trade::handler(ctx, args)
    }
}
