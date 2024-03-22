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
import dotenv from 'dotenv';

import {InviteBot} from './invite_bot';

import type {ApplicationFunction, Context} from 'probot';
import type {Knex} from 'knex';

type AppHandledContext = Context<
  | 'issue_comment'
  | 'issues'
  | 'pull_request'
  | 'pull_request_review'
  | 'pull_request_review_comment'
>;

export function appFactory(db: Knex): ApplicationFunction {
  return (app: Probot): void => {
    if (process.env.NODE_ENV !== 'test') {
      dotenv.config();
    }

    const helpUserToTag = process.env.HELP_USER_TO_TAG;

    function botFromContext({
      octokit,
      payload,
      log,
    }: AppHandledContext): InviteBot {
      return new InviteBot(
        db,
        octokit,
        payload.repository.owner.login,
        process.env.ALLOW_TEAM_SLUG ?? '',
        helpUserToTag,
        log
      );
    }

    app.on('issue_comment.created', async context => {
      await botFromContext(context).processComment(
        context.payload.repository.name,
        context.payload.issue.number,
        context.payload.comment.body,
        context.payload.comment.user.login
      );
    });

    app.on('issues.opened', async context => {
      await botFromContext(context).processComment(
        context.payload.repository.name,
        context.payload.issue.number,
        context.payload.issue.body ?? '',
        context.payload.issue.user.login
      );
    });

    app.on('pull_request.opened', async context => {
      await botFromContext(context).processComment(
        context.payload.repository.name,
        context.payload.pull_request.number,
        context.payload.pull_request.body ?? '',
        context.payload.pull_request.user.login
      );
    });

    app.on('pull_request_review.submitted', async context => {
      await botFromContext(context).processComment(
        context.payload.repository.name,
        context.payload.pull_request.number,
        context.payload.review.body ?? '',
        context.payload.review.user.login
      );
    });

    app.on('pull_request_review_comment.created', async context => {
      await botFromContext(context).processComment(
        context.payload.repository.name,
        context.payload.pull_request.number,
        context.payload.comment.body,
        context.payload.comment.user.login
      );
    });

    app.on('organization.member_added', async ({octokit, payload, log}) => {
      const inviteBot = new InviteBot(
        db,
        octokit,
        payload.organization.login,
        process.env.ALLOW_TEAM_SLUG ?? '',
        helpUserToTag,
        log
      );
      await inviteBot.processAcceptedInvite(payload.membership.user.login);
    });
  };
}
