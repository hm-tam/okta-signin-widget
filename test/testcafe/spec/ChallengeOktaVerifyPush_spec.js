import { RequestMock, RequestLogger } from 'testcafe';
import SuccessPageObject from '../framework/page-objects/SuccessPageObject';
import ChallengeOktaVerifyPushPageObject from '../framework/page-objects/ChallengeOktaVerifyPushPageObject';

import pushPoll from '../../../playground/mocks/data/idp/idx/authenticator-verification-okta-verify-push';
import success from '../../../playground/mocks/data/idp/idx/success';
import pushReject from '../../../playground/mocks/data/idp/idx/error-okta-verify-push';

const logger = RequestLogger(/challenge|challenge\/poll/,
  {
    logRequestBody: true,
    stringifyRequestBody: true,
  }
);

const pushSuccessMock = RequestMock()
  .onRequestTo('http://localhost:3000/idp/idx/introspect')
  .respond(pushPoll)
  .onRequestTo('http://localhost:3000/idp/idx/challenge/poll')
  .respond(success);

const pushRejectMock = RequestMock()
  .onRequestTo('http://localhost:3000/idp/idx/introspect')
  .respond(pushPoll)
  .onRequestTo('http://localhost:3000/idp/idx/challenge/poll')
  .respond(pushReject, 403);


fixture('Challenge Okta Verify Push Form');

async function setup(t) {
  const challengeOktaVerifyPushPageObject = new ChallengeOktaVerifyPushPageObject(t);
  await challengeOktaVerifyPushPageObject.navigateToPage();
  return challengeOktaVerifyPushPageObject;
}

test
  .requestHooks(pushSuccessMock)('challenge ov push screen has right labels', async t => {
    const challengeOktaVerifyPushPageObject = await setup(t);

    const { log } = await t.getBrowserConsoleMessages();
    await t.expect(log.length).eql(3);
    await t.expect(log[0]).eql('===== playground widget ready event received =====');
    await t.expect(log[1]).eql('===== playground widget afterRender event received =====');
    await t.expect(JSON.parse(log[2])).eql({
      controller: 'mfa-verify',
      formName: 'okta-verify-poll',
      authenticatorType: 'app',
    });

    const pageTitle = challengeOktaVerifyPushPageObject.getPageTitle();
    const pushBtnText = challengeOktaVerifyPushPageObject.getPushButtonLabel();
    await t.expect(pushBtnText).contains('Push notification sent');
    await t.expect(pageTitle).contains('Get a push notification');
  });

test
  .requestHooks(pushRejectMock)('challenge okta verify with rejected push', async t => {
    const challengeOktaVerifyPushPageObject = await setup(t);
    await challengeOktaVerifyPushPageObject.waitForErrorBox();
    await t.expect(challengeOktaVerifyPushPageObject.getError()).contains('You have chosen to reject this login.');
    const pushBtnText = challengeOktaVerifyPushPageObject.getPushButtonLabel();
    await t.expect(pushBtnText).contains('Send push notification');
  });

test
  .requestHooks(logger, pushSuccessMock)('challenge okta verify push request', async t => {
    await setup(t);
    const successPage = new SuccessPageObject(t);
    const pageUrl = await successPage.getPageUrl();
    await t.expect(pageUrl)
      .eql('http://localhost:3000/app/UserHome?stateToken=mockedStateToken123');
    await t.expect(logger.count(() => true)).eql(1);

    const { request: {
      body: answerRequestBodyString,
      method: answerRequestMethod,
      url: answerRequestUrl,
    }
    } = logger.requests[0];
    const answerRequestBody = JSON.parse(answerRequestBodyString);
    await t.expect(answerRequestBody).eql({
      stateHandle: '022P5Fd8jBy3b77XEdFCqnjz__5wQxksRfrAS4z6wP'
    });
    await t.expect(answerRequestMethod).eql('post');
    await t.expect(answerRequestUrl).eql('http://localhost:3000/idp/idx/challenge/poll');
  });
