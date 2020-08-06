import ChallengeFactorPageObject from './ChallengeFactorPageObject';

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

}
