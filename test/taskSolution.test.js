'use strict'
const assert = require('assert')
const request = require('supertest')
const expect = require('chai').expect
const chai = require('chai')
const spies = require('chai-spies')
const api = require('../server')
const agent = request.agent(api)
const nock = require('nock')
const models = require('../models')
const secrets = require('../config/secrets')
const { registerAndLogin, createTask, truncateModels } = require('./helpers')
const { account } = require('../modules/app/controllers/auth')

describe("Task Solution", () => {
  beforeEach(async () => {
    await truncateModels(models.Task);
    await truncateModels(models.User);
    await truncateModels(models.Assign);
    await truncateModels(models.Order);
    await truncateModels(models.Transfer);
  })
  it('should create a task solution', async () => {
    try {
      const solutionParams = {
        pullRequestId: '2',
        userId: 1,
        repositoryName: 'test-repository',
        owner: 'alexanmtz',
        taskId: 1
      }
      
      nock('https://api.github.com')
        .persist()
        .get(`/repos/${solutionParams.owner}/${solutionParams.repositoryName}/pulls/${solutionParams.pullRequestId}`)
        
        .reply(200, {
          user: {
            login: 'alexanmtz'
          },
          state: 'closed',
          merged: true,
          title: 'test PR #1',
          body: 'closes #1'
        })
      // Await the login process
      const loginResponse = await registerAndLogin(agent, {
        email: 'tasksolutiontest@test.com',
        provider: 'github',
        provider_username: 'alexanmtz',
      });
      const { body: user, headers } = loginResponse;
  
      // Create the task
      const task = await createTask(agent, {
        url: 'https://github.com/alexanmtz/test-repository/issues/1',
        userId: user.id,
        status: 'closed'
      });

      // Create order
      const order = await models.Order.create({
        provider: 'stripe',
        amount: 100,
        userId: user.id,
        TaskId: task.id,
        source_id: '1234',
        status: 'succeeded',
        paid: true
      });
  
      // Send a POST request to create a task solution
      const taskSolutionCreateRes = await agent
        .post('/tasksolutions/create')
        .set('Authorization', headers.authorization)
        .expect('Content-Type', /json/)
        .expect(200)
        .send({
          isConnectedToGitHub: true,
          isAuthorOfPR: true,
          isPRMerged: true,
          isIssueClosed: true,
          hasIssueReference: true,
          pullRequestURL: "https://github.com/alexanmtz/test-repository/pull/2",
          userId: user.id,
          taskId: task.id
        });
      expect(taskSolutionCreateRes.body).to.have.property('id');
    } catch (err) {
      // Fail the test if any error occurs
      throw err;
    }
  });
  it('should create a task solution with stripe response with insuficient capatibilities', async () => {
    try {
      const solutionParams = {
        pullRequestId: '2',
        userId: 1,
        repositoryName: 'test-repository',
        owner: 'alexanmtz',
        taskId: 1
      }

      nock('https://api.stripe.com')
        .post('/v1/transfers')
        .reply(400, {
          "error": {
            "code": "insufficient_capabilities_for_transfer",
            "message": "Your destination account needs to have at least one of the following capabilities enabled: transfers, crypto_transfers, legacy_payments",
            "request_log_url": "https://dashboard.stripe.com/logs/req_agK5H7d0oxGetF?t=1730319991",
            "type": "invalid_request_error"
          }
        })
      
      nock('https://api.github.com')
        .persist()
        .get(`/repos/${solutionParams.owner}/${solutionParams.repositoryName}/pulls/${solutionParams.pullRequestId}`)
        
        .reply(200, {
          user: {
            login: 'alexanmtz'
          },
          state: 'closed',
          merged: true,
          title: 'test PR #1',
          body: 'closes #1'
        })
      // Await the login process
      const loginResponse = await registerAndLogin(agent, {
        email: 'tasksolutiontest@test.com',
        provider: 'github',
        provider_username: 'alexanmtz',
        account_id: 'acc_test'
      });
      const { body: user, headers } = loginResponse;
  
      // Create the task
      const task = await createTask(agent, {
        url: 'https://github.com/alexanmtz/test-repository/issues/1',
        userId: user.id,
        status: 'closed'
      });

      // Create order
      const order = await models.Order.create({
        provider: 'stripe',
        amount: 100,
        userId: user.id,
        TaskId: task.id,
        source_id: '1234',
        status: 'succeeded',
        paid: true
      });
  
      // Send a POST request to create a task solution
      const taskSolutionCreateRes = await agent
        .post('/tasksolutions/create')
        .set('Authorization', headers.authorization)
        .expect('Content-Type', /json/)
        .expect(400)
        .send({
          isConnectedToGitHub: true,
          isAuthorOfPR: true,
          isPRMerged: true,
          isIssueClosed: true,
          hasIssueReference: true,
          pullRequestURL: "https://github.com/alexanmtz/test-repository/pull/2",
          userId: user.id,
          taskId: task.id
        });
      expect(taskSolutionCreateRes.statusCode).to.equal(400);
      expect(taskSolutionCreateRes.body.error).to.equal('issue.solution.error.insufficient_capabilities_for_transfer');
    } catch (err) {
      // Fail the test if any error occurs
      throw err;
    }
  });
  it('should update a task solution', async () => {
    try {
      const solutionParams = {
        pullRequestId: '2',
        userId: 1,
        repositoryName: 'test-repository',
        owner: 'alexanmtz',
        taskId: 1
      }
      
      nock('https://api.github.com')
        .persist()
        .get(`/repos/${solutionParams.owner}/${solutionParams.repositoryName}/pulls/${solutionParams.pullRequestId}`)
        
        .reply(200, {
          user: {
            login: 'alexanmtz'
          },
          state: 'closed',
          merged: true,
          title: 'test PR #1',
          body: 'closes #1'
        })
      // Await the login process
      const loginResponse = await registerAndLogin(agent, {
        email: 'tasksolutiontest2@test.com',
        provider: 'github',
        provider_username: 'alexanmtz',
      });
      const { body: user, headers } = loginResponse;
  
      // Create the task
      const task = await createTask(agent, {
        url: 'https://github.com/alexanmtz/test-repository/issues/1',
        userId: user.id,
        status: 'closed'
      });

      // Create order
      const order = await models.Order.create({
        amount: 100,
        userId: user.id,
        TaskId: task.id,
        source_id: '1234',
        status: 'succeeded',
        paid: true
      });

      const taskSolutionCreateRes = await models.TaskSolution.create({
        isConnectedToGitHub: true,
        isAuthorOfPR: true,
        isPRMerged: true,
        isIssueClosed: true,
        hasIssueReference: true,
        pullRequestURL: "https://github.com/alexanmtz/test-repository/pull/2",
        userId: user.id,
        taskId: task.id
      })
  
      // Send a PUT request to update a task solution
      const taskSolutionUpdateRes = await agent
        .patch('/tasksolutions/' + taskSolutionCreateRes.dataValues.id)
        .set('Authorization', headers.authorization)
        .expect('Content-Type', /json/)
        .expect(200)
        .send({
          isConnectedToGitHub: true,
          isAuthorOfPR: true,
          isPRMerged: true,
          isIssueClosed: true,
          hasIssueReference: true,
          pullRequestURL: "https://github.com/alexanmtz/test-repository/pull/2",
          userId: user.id,
          taskId: task.id
        });
      expect(taskSolutionUpdateRes.body).to.have.property('isConnectedToGitHub');
      expect(taskSolutionUpdateRes.body).to.have.property('isAuthorOfPR');
      expect(taskSolutionUpdateRes.body).to.have.property('isPRMerged');
      expect(taskSolutionUpdateRes.body).to.have.property('isIssueClosed');
      expect(taskSolutionUpdateRes.body).to.have.property('hasIssueReference');
    } catch (err) {
      // Fail the test if any error occurs
      throw err;
    }
  });   
})