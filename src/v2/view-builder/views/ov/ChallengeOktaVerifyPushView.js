import { _, loc, createButton, View } from 'okta';
import hbs from 'handlebars-inline-precompile';
import BaseView from '../../internals/BaseView';
import BaseForm from '../../internals/BaseForm';
import BaseAuthenticatorView from '../../components/BaseAuthenticatorView';
import AuthenticatorVerifyFooter from '../../components/AuthenticatorVerifyFooter';
import polling from '../shared/polling';
import Util from '../../../../util/Util';

const WARNING_TIMEOUT = 30000;
const warningTemplate = View.extend({
  className: 'okta-form-infobox-warning infobox infobox-warning',
  template: hbs`
    <span class="icon warning-16"></span>
    <p>{{warning}}</p>
  `
});
let warningTimeout;

const Body = BaseForm.extend(Object.assign(
  {
    noButtonBar: true,

    className: 'okta-verify-push-challenge',

    title () {
      return loc('oie.okta_verify.push.title', 'login');
    },

    initialize () {
      BaseForm.prototype.initialize.apply(this, arguments);
      this.listenTo(this.model, 'error', this.stopPush);
      this.listenTo(this.model, 'change:isPushSent', this.setButtonState.bind(this));
      this.listenTo(this.options.appState, 'switchForm', this.stopPolling.bind(this));
      this.addView();
    },

    addView () {
      this.add(createButton({
        className: 'button button-wide button-primary send-push',
        click: () => {
          this.startPush();
        }
      }));
    },

    postRender () {
      this.startPush();
    },

    startPush () {
      this.clearErrors();
      this.model.set('isPushSent', true);
      this.startPolling();
      warningTimeout = Util.callAfterTimeout(_.bind(function () {
        this.showWarning(loc('oktaverify.warning', 'login'));
      }, this), WARNING_TIMEOUT);
    },

    stopPush () {
      this.stopPolling();
      this.clearWarning();
      this.model.set('isPushSent', false);
    },

    setButtonState () {
      const button = this.$el.find('.send-push');
      if (this.model.get('isPushSent')) {
        button.addClass('link-button-disabled');
        button.html(loc('oie.okta_verify.push.sent', 'login'));
        button.prop('disabled', true);
      } else {
        button.removeClass('link-button-disabled');
        button.html(loc('oie.okta_verify.push.send', 'login'));
        button.prop('disabled', false);
      }
    },

    showWarning (msg) {
      this.clearWarning();
      this.add(warningTemplate, '.o-form-error-container', {options: {warning: msg}});
    },

    clearWarning () {
      if (this.$('.o-form-error-container div').hasClass('okta-form-infobox-warning')) {
        this.$('.okta-form-infobox-warning').remove();
      }
      clearTimeout(warningTimeout);
    },
  },

  polling,
));

export default BaseAuthenticatorView.extend({
  Body,
  Footer: AuthenticatorVerifyFooter,

  createModelClass () {
    const ModelClass = BaseView.prototype.createModelClass.apply(this, arguments);
    const local = Object.assign(
      {
        isPushSent: {
          'value': false,
          'type': 'boolean',
        },
      },
      ModelClass.prototype.local,
    );
    return ModelClass.extend({
      local,
    });
  },
});
