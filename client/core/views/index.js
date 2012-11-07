
define(['views/dashboard', 'views/app',
	'views/flow', 'views/flow-history', 'views/detail/flowletdetail',
	'views/injector', 'views/visualizer', 'views/dagnode',
	'views/modal', 'views/informer', 'views/chart', 'views/list/list-page', 'views/list/flow-list',
	'views/list/app-list', 'views/list/stream-list', 'views/list/dataset-list', 'views/list/query-list',
	'views/dropzone',
	'views/dataset', 'views/stream', 'views/timeselector', 'views/create-button', 'views/create-dialogue',
	'views/detail/streamdetail', 'views/create-textfield', 'views/detail/querydetail', 'views/query', 'views/flow-log'],
	function (D, A, F, Fh, Fd, Pl, Vz, Dn, M, I, C, Lp, Fl, Al, Sl, Dsl, Ql, Dz, Ds, S, Ts, Cb, Cr, Sd, Ctx, Qd, Q, Flo) {
		return {
			Dash: D,
			Application: A,
			FlowStatus: F,
			FlowHistory: Fh,
			FlowletDetail: Fd,
			Injector: Pl,
			Visualizer: Vz,
			DagNode: Dn,
			Modal: M,
			Informer: I,
			Chart: C,
			ListPage: Lp,
			FlowList: Fl,
			ApplicationList: Al,
			StreamList: Sl,
			DatasetList: Dsl,
			QueryList: Ql,
			DropZone: Dz,
			Dataset: Ds,
			Stream: S,
			TimeSelector: Ts,
			CreateButton: Cb,
			Create: Cr,
			StreamDetail: Sd,
			TextField: Ctx,
			QueryDetail: Qd,
			Query: Q,
			FlowLog: Flo
		};
	}
);