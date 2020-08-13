import ChallengeFactorPageObject from './ChallengeFactorPageObject';

const FORM_INFOBOX_WARNING = '.okta-form-infobox-warning';

export default class ChallengeOktaVerifyPushPageObject extends ChallengeFactorPageObject {
  constructor(t) {
    super(t);
  }

  getPushButtonLabel () {
    return this.form.getElement('.send-push').textContent;
  }

  getError () {
    return this.form.getErrorBoxText();
  }

  getWarningBox () {
    return this.form.getElement(FORM_INFOBOX_WARNING);
  }

}
