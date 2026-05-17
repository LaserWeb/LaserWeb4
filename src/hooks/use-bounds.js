import { useCallback, useState } from "react";

// TODO: We may need a ResizeObserver here, for cases where the measured object is moved later (eg. due to a panel resize)?

export default function useBounds() {
	let [ left, setLeft ] = useState(0);
	let [ right, setRight ] = useState(0);
	let [ top, setTop ] = useState(0);
	let [ bottom, setBottom ] = useState(0);

	let refCallback = useCallback((element) => {
		/* HACK: requestAnimationFrame is used to keep reinvoking the measuring code until the target element 'settles' (ie. no longer changes the results). Every time the component re-renders, it schedules a measurement for the next animation frame. If the result changes any of the state values, this then triggers another re-render, scheduling another re-measurement, and so forth. This seems to be in place to deal with (anchoring to) animated elements specifically. */
		requestAnimationFrame(() => {
			if (element != null) {
				let rect = element.getBoundingClientRect();
	
				/* The below will only trigger a re-render if any of the values have actually changed */
				setLeft(rect.left);
				setRight(rect.right);
				setTop(rect.top);
				setBottom(rect.bottom);
			}
		});
	});

	return [ refCallback, { left, right, top, bottom }];
}
