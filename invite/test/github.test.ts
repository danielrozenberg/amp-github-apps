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

import {DeepMockProxy, mockDeep} from 'jest-mock-extended';
import {ProbotOctokit} from 'probot';

import {GitHub} from '../src/github';
import {getOctokitResponse} from './fixtures';

describe('GitHub interface', () => {
  let mockGithubClient: DeepMockProxy<ProbotOctokit>;
  let github: GitHub;

  beforeEach(() => {
    mockGithubClient = mockDeep<ProbotOctokit>();
    github = new GitHub(mockGithubClient, 'test_org');
  });

  describe('inviteUser', () => {
    it('returns false when the user is already a member', async () => {
      mockGithubClient.rest.orgs.setMembershipForUser.mockResolvedValue(
        getOctokitResponse('add_member.exists')
      );

      await expect(github.inviteUser('someone')).resolves.toBe(false);

      expect(
        mockGithubClient.rest.orgs.setMembershipForUser
      ).toHaveBeenCalledWith({
        org: 'test_org',
        username: 'someone',
      });
    });

    it('returns true when the user is invited', async () => {
      mockGithubClient.rest.orgs.setMembershipForUser.mockResolvedValue(
        getOctokitResponse('add_member.invited')
      );

      await expect(github.inviteUser('someone')).resolves.toBe(true);

      expect(
        mockGithubClient.rest.orgs.setMembershipForUser
      ).toHaveBeenCalledWith({
        org: 'test_org',
        username: 'someone',
      });
    });
  });

  describe('addComment', () => {
    it('POSTs comment to /repos/:owner/:repo/issues/:issue_number/comments', async () => {
      await github.addComment('test_repo', 1337, 'Test comment');

      expect(mockGithubClient.rest.issues.createComment).toHaveBeenCalledWith({
        owner: 'test_org',
        repo: 'test_repo',
        'issue_number': 1337,
        body: 'Test comment',
      });
    });
  });

  describe('assignIssue', () => {
    it('POSTs assignee to /repos/:owner/:repo/issues/:issue_number/assignees', async () => {
      await github.assignIssue('test_repo', 1337, 'someone');

      expect(mockGithubClient.rest.issues.addAssignees).toHaveBeenCalledWith({
        owner: 'test_org',
        repo: 'test_repo',
        'issue_number': 1337,
        assignees: ['someone'],
      });
    });
  });

  describe('userIsTeamMember', () => {
    it('returns true for "active" membership state', async () => {
      mockGithubClient.rest.teams.getMembershipForUserInOrg.mockResolvedValue(
        getOctokitResponse('team_membership.active')
      );

      await expect(
        github.userIsTeamMember('someone', 'test_org/test-team')
      ).resolves.toBe(true);

      expect(
        mockGithubClient.rest.teams.getMembershipForUserInOrg
      ).toHaveBeenCalledWith({
        org: 'test_org',
        'team_slug': 'test-team',
        username: 'someone',
      });
    });

    it('returns false for "pending" membership state', async () => {
      mockGithubClient.rest.teams.getMembershipForUserInOrg.mockResolvedValue(
        getOctokitResponse('team_membership.pending')
      );

      await expect(
        github.userIsTeamMember('someone', 'test_org/test-team')
      ).resolves.toBe(false);

      expect(
        mockGithubClient.rest.teams.getMembershipForUserInOrg
      ).toHaveBeenCalledWith({
        org: 'test_org',
        'team_slug': 'test-team',
        username: 'someone',
      });
    });

    it('returns false for 404: Not Found', async () => {
      mockGithubClient.rest.teams.getMembershipForUserInOrg.mockResolvedValue(
        getOctokitResponse('team_membership.not_found', 404)
      );

      await expect(
        github.userIsTeamMember('someone', 'test_org/test-team')
      ).resolves.toBe(false);

      expect(
        mockGithubClient.rest.teams.getMembershipForUserInOrg
      ).toHaveBeenCalledWith({
        org: 'test_org',
        'team_slug': 'test-team',
        username: 'someone',
      });
    });
  });
});
