window.dataLayer = window.dataLayer || [];
function gtag() {
	// biome-ignore lint/complexity/noArguments: GTM consent snippet requires the Arguments object
	window.dataLayer.push(arguments);
}
gtag("consent", "default", {
	analytics_storage: "denied",
	functionality_storage: "denied",
	personalization_storage: "denied",
	ad_storage: "denied",
	ad_user_data: "denied",
	ad_personalization: "denied",
	security_storage: "granted",
	wait_for_update: 500,
});
