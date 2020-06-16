import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import '../snc-now-experience-dashboard';

const view = (state, { updateState }) => {
	return (
		<snc-now-experience-dashboard />
	);
};

// Don't change this!
createCustomElement('x-409431-cy-now-ui-task-list', {
	renderer: { type: snabbdom },
	view,
	styles
});