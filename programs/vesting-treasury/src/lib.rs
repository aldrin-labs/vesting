pub mod endpoints;
pub mod err;
pub mod models;
pub mod prelude;

use crate::endpoints::*;
use crate::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vesting_treasury {
    use super::*;

    pub fn create_vesting_schedule(
        ctx: Context<CreateVestingSchedule>,
        vesting_amount: TokenAmount,
        start_ts: TimeStamp,
        cliff_periods: u64,
        total_periods: u64,
        period_type: u32,
    ) -> Result<()> {
        endpoints::create_vesting_schedule::handle(
            ctx,
            vesting_amount,
            start_ts,
            cliff_periods,
            total_periods,
            period_type,
        )
    }

    pub fn change_vestee_wallet(ctx: Context<ChangeVesteeWallet>) -> Result<()> {
        endpoints::change_vestee_wallet::handle(ctx)
    }
}
