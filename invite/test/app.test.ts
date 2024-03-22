/**
 * Copyright 2020 The AMP HTML Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Probot} from 'probot';

import {InviteBot} from '../src/invite_bot';
import {appFactory} from '../src/app';
import {inMemoryDbConnect} from './_test_helper';
import {triggerWebhook} from './fixtures';

describe('Probot webhooks', () => {
  const db = inMemoryDbConnect();
  const app = appFactory(db);

  let probot: Probot;

  beforeAll(() => {
    process.env = {
      DISABLE_WEBHOOK_EVENT_CHECK: 'true',
      GITHUB_ORG: 'test_org',
      GITHUB_ACCESS_TOKEN: '_TOKEN_',
      NODE_ENV: 'test',
    };

    probot = new Probot({appId: 1, githubToken: 'test'});
    probot.load(app);
  });

  beforeEach(() => {
    jest
      .spyOn(InviteBot.prototype, 'processComment')
      .mockImplementation(async () => {
        // Do nothing
      });
    jest
      .spyOn(InviteBot.prototype, 'processAcceptedInvite')
      .mockImplementation(async () => {
        // Do nothing
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe.each([
    ['issue_comment.created'],
    ['issues.opened'],
    ['pull_request.opened'],
    ['pull_request_review.submitted'],
    ['pull_request_review_comment.created'],
  ])(`on %p event`, eventName => {
    it('processes the comment for macros', async () => {
      await triggerWebhook(probot, eventName);

      expect(InviteBot.prototype.processComment).toHaveBeenCalledWith(
        'test_repo',
        1337,
        'Test comment',
        'author'
      );
    });
  });

  describe.each([
    ['issue_comment.edited'],
    ['issue_comment.deleted'],
    ['pull_request_review.edited'],
    ['pull_request_review.dismissed'],
    ['pull_request_review_comment.edited'],
    ['pull_request_review_comment.deleted'],
  ])(`on %p event`, eventName => {
    it('does not processes the comment', async () => {
      await triggerWebhook(probot, eventName);

      expect(InviteBot.prototype.processComment).not.toHaveBeenCalled();
    });
  });

  describe('on "organization.member_added" event', () => {
    it('processes the accepted invite with follow-up actions', async () => {
      await triggerWebhook(probot, 'organization.member_added');

      expect(InviteBot.prototype.processAcceptedInvite).toHaveBeenCalledWith(
        'someone'
      );
    });
  });

  describe('on "organization.member_invited" event', () => {
    it('does not process the new membership', async () => {
      await triggerWebhook(probot, 'organization.member_invited');

      expect(
        InviteBot.prototype.processAcceptedInvite
      ).not.toHaveBeenCalledWith();
    });
  });

  describe('on "organization.member_removed" event', () => {
    it('does not process the new membership', async () => {
      await triggerWebhook(probot, 'organization.member_removed');

      expect(
        InviteBot.prototype.processAcceptedInvite
      ).not.toHaveBeenCalledWith();
    });
  });
});
