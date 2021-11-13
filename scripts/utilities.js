/**  @param {number} t */
function parabolicEasing(t) {
	// given a parabolla with x intercepts of 0 and 4
	// and a y vertex of 4 we have a formula of:
	// y = -(x - 2)^2 + 4
	const x = t * 4 - 2;
	const y = x * x * -1 + 4;

	// translate y back into a percentage from 0 to 1+
	return y / 4;
}