import React, { useState, useEffect } from 'react'
import { Redirect, withRouter } from 'react-router-dom'
import SendSolutionForm from './send-solution-form'
import {
  DialogTitle,
  DialogActions,
  DialogContent,
  Button,
  Typography
} from '@material-ui/core'
import { FormattedMessage } from 'react-intl'
import { validAccount } from '../../utils/valid-account'
import AccountRequirements from '../../components/design-library/molecules/account-requirements/account-requirements'
import SendSolutionRequirements from './send-solution-requirements'
import TaskSolution from './task-solution'

const SendSolutionDialog = props => {
  const [pullRequestURL, setPullRequestURL] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [timer, setTimer] = useState()

  const { taskSolution, pullRequestData, task, user, fetchAccount, account, history } = props

  useEffect(() => {
    user.id && task.data.id && props.getTaskSolution(user.id, task.data.id)
  }, [user, task])

  useEffect(() => {
    props.cleanPullRequestDataState()
  }, [props.assignDialog])

  useEffect(() => {
    if (pullRequestURL.length >= 20) {
      clearTimeout(timer)
      setTimer(setTimeout(() => {
        const urlSplitted = pullRequestURL.split('/')
        props.fetchPullRequestData(urlSplitted[3], urlSplitted[4], urlSplitted[6], props.user.id, task.data.id)
      }, 2500))
    }
  }, [pullRequestURL])

  useEffect(() => {
    fetchAccount()
  }, [])

  const handlePullRequestURLChange = (event) => {
    setPullRequestURL(event.target.value)
  }

  const handleTaskSolutionUpdate = () => {
    setEditMode(true)
  }

  const submitTaskSolution = () => {
    if (editMode) {
      const payload = { pullRequestURL: pullRequestURL, taskId: task.data.id, userId: props.user.id, taskSolutionId: taskSolution.id }
      props.updateTaskSolution(payload).then((solution) => {
        
      })
      setEditMode(false)
      // eslint-disable-next-line no-useless-return
      return
    }

    const payload = { ...pullRequestData, pullRequestURL: pullRequestURL, taskId: task.data.id, userId: props.user.id }

    props.createTaskSolution(payload).then((solution) => {
      
    })
  }

  if(!user.id) {
    return <Redirect to='/signin' />
  }

  return (
    <React.Fragment>
      <DialogTitle>
        <Typography type='headline' variant='h6' style={ { color: 'black' } }>
          <FormattedMessage id='task.solution.dialog.message' defaultMessage='Send a solution for this issue' />
        </Typography>
        <Typography variant='body2' style={ { color: 'black' } } gutterBottom>
          <FormattedMessage id='task.solution.dialog.description' defaultMessage='You can send a solution for this issue providing the Pull Request / Merge Request URL of your solution:' />
        </Typography>
      </DialogTitle>
      <DialogContent>
        <AccountRequirements
          user={ user }
          account={ account }
          onClick={() => history.push('/profile/user-account/payouts')}
        />
        { Object.keys(props.taskSolution).length === 0 || editMode
          ? <React.Fragment>
            <SendSolutionForm handlePullRequestURLChange={ handlePullRequestURLChange } pullRequestURL={ pullRequestURL } />
            <SendSolutionRequirements completed={ props.completed } isConnectedToGitHub={ pullRequestData.isConnectedToGitHub } isAuthorOfPR={ pullRequestData.isAuthorOfPR } isPRMerged={ pullRequestData.isPRMerged } isIssueClosed={ pullRequestData.isIssueClosed } hasIssueReference={ pullRequestData.hasIssueReference } />
          </React.Fragment>
          : <TaskSolution taskSolution={ taskSolution } task={task.data} />
        }
      </DialogContent>
      <DialogActions>
        <Button onClick={ props.handleAssignFundingDialogClose } color='primary'>
          <FormattedMessage id='task.bounties.actions.cancel' defaultMessage='Cancel' />
        </Button>
        { Object.keys(props.taskSolution).length !== 0 && !editMode // Edit mode will change the button to "send solution"
          ? <Button data-testid='edit-solution-button' type='primary' htmlFor='submit' variant='contained' color='primary' onClick={ handleTaskSolutionUpdate } disabled={ task.data.paid || task.data.Transfer || task.data.transfer_id }>
            <FormattedMessage id='task.solution.form.edit' defaultMessage='Edit Solution' />
          </Button>
          : <Button data-testid='send-solution-button' type='primary' htmlFor='submit' variant='contained' color='primary' disabled={
            !pullRequestURL ||
            !pullRequestData.isConnectedToGitHub ||
            !pullRequestData.isAuthorOfPR ||
            !pullRequestData.isPRMerged ||
            !pullRequestData.isIssueClosed ||
            !pullRequestData.hasIssueReference ||
            task.data.paid ||
            task.data.transfer_id ||
            task.data.Transfer ||
            !validAccount(user, account)
          } onClick={ submitTaskSolution }>
            <FormattedMessage id='task.solution.form.send' defaultMessage='Send Solution' />
          </Button>
        }
      </DialogActions>
    </React.Fragment>
  )
}

export default withRouter(SendSolutionDialog)
