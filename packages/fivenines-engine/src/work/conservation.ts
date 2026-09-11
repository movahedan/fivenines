export interface WorkBalance {
	demanded: number;
	handled: number;
	waiting: number;
	rejected: number;
	infeasible: number;
}

export function conserveWork(balance: WorkBalance): boolean {
	return (
		balance.demanded === balance.handled + balance.waiting + balance.rejected + balance.infeasible
	);
}
