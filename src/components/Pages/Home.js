import React from 'react'
import { connect } from '@cerebral/react'
import { state, signal } from 'cerebral/tags'
import Tour from 'reactour'
import yeast from 'yeast'
import { keys, size, map, isNil, isEmpty, assignIn, values, uniqBy } from 'lodash'
import { Container, Grid, Divider, Button, Input, Loader, Tab, Form, List, Checkbox, Dropdown } from 'semantic-ui-react'

import UploadArea from '../UploadArea'
import { Selector as ModelSelector } from '../Model'

const fontFamily = '"Raleway", "Helvetica Neue", Helvetica, Arial, sans-serif'

const trace_options = [
  { key: 0, text: 'None', value: 'NO_TRACE' },
  { key: 1, text: 'Step', value: 'STEP_TRACE' },
  { key: 2, text: 'Framework', value: 'FRAMEWORK_TRACE' },
  { key: 3, text: 'CPU', value: 'CPU_ONLY_TRACE' },
  { key: 4, text: 'Hardware', value: 'HARDWARE_TRACE' },
  { key: 5, text: 'Full', value: 'FULL_TRACE' },
]

const datasetOptions = [
  { key: 0, value: 'ilsvrc2012', text: 'vision/ilsvrc2012' },
  { key: 1, value: 'cifar10', text: 'vision/cifar10' },
  { key: 2, value: 'cifar100', text: 'vision/cifar100' },
  { key: 3, value: 'caltech256', text: 'vision/caltech256' },
  { key: 4, value: 'mnist', text: 'vision/mnist' },
  { key: 5, value: 'custom', text: 'vision/custom' },
]

export default connect(
  {
    predictInputs: state`predictInputs`,
    isPredicting: state`status.isPredicting`,
    isTutorial: state`status.isTutorial`,
    selectedModels: state`models.selectedModels`,
    device: state`device`,
    traceLevel: state`traceLevel`,
    agents: state`frameworks.agents`,
    predictInputsSet: signal`predictInputsSet`,
    predictURLChanged: signal`predictURLChanged`,
    predictURLAdded: signal`predictURLAdded`,
    batchSizeChanged: signal`batchSizeChanged`,
    deviceChanged: signal`deviceChanged`,
    traceLevelChanged: signal`traceLevelChanged`,
    agentChanged: signal`agentChanged`,
    inferenceButtonClicked: signal`inferenceButtonClicked`,
    openTutorial: signal`openTutorial`,
    closeTutorial: signal`closeTutorial`,
  },
  class HomePage extends React.Component {
    constructor() {
      super()
      this.state = {
        isTourOpen: false,
        isShowingMore: false,
        isModelSelectorOpen: true,
      }
    }

    steps = () =>
      map(
        [
          {
            selector: '[data-tut="main-header"]',
            position: 'right',
            content: () => (
              <div>
                The <i>CarML</i> (<b>Cognitive ARtifacts for Machine Learning</b>) is a platform allowing people to
                easily deploy and experiment ML/DL frameworks and models. It allows ML/DL software developers to deploy
                their software packages, ML model developers to publish and evaluate their models, users to experiment
                with different models and frameworks, all through a web user interface or a REST api, and system
                architects to capture system resource usage to inform future system and hardware configuration.
              </div>
            ),
            style: {
              left: '25%',
              maxWidth: '100%!important',
              minWidth: '50%',
              width: '100%',
              margin: 'auto',
            },
          },
          {
            selector: '[data-tut="select-model"]',
            position: 'top',
            content:
              'Models from different frameworks can be selected to perform inference. This includes tensorflow, caffe, caffe2, tensorrt, and mxnet.',
          },
          {
            selector: '[data-tut="select-accelerator"]',
            content: 'Accelerators can be enabled to perform inference',
            action: () => {
              this.closeModelSelector()
            },
          },
          {
            selector: '[data-tut="select-batchsize"]',
            content:
              'Inference can be performed with different batch sizes. Different batch sizes impact the performnace of the inference.',
          },
          {
            selector: '[data-tut2="select-tracelevel"]',
            position: 'right',
            content: () => (
              <div>
                {"You can control CarML's tracing granularity. The tracing is available for developer."}
                <List>
                  <List.Item as="li">
                    <b> None: </b> Disable tracing.
                  </List.Item>
                  <List.Item as="li">
                    <b> Step: </b> Capture inference events recorded by CarML.
                  </List.Item>
                  <List.Item as="li">
                    <b> Framework: </b> Capture inference events recorded by the framework and CarML.
                  </List.Item>
                  <List.Item as="li">
                    <b> CPU: </b> Capture inference events recorded by the CPU.
                  </List.Item>
                  <List.Item as="li">
                    <b> Hardware: </b> Capture inference events recorded by the accelerator.
                  </List.Item>
                  <List.Item as="li">
                    <b> Full: </b> Capture all tracing events recorded.
                  </List.Item>
                </List>
              </div>
            ),
          },
          {
            selector: '[data-tut="select-datainput"]',
            content:
              'Inference can be performed with image url or uploaded user dataset or exsiting datasets. You can add multiple image urls by pressing `ENTER`.',
          },
          {
            selector: '[data-tut="select-predict"]',
            content: 'Click to perform the inference.',
          },
          {
            selector: '[data-tut="nav-home"]',
            content: 'At any point, you can go to the main CarML home page.',
          },
          {
            selector: '[data-tut="nav-agents"]',
            content: 'You can view all the CarML agents that service models through the agents page.',
          },
          {
            selector: '[data-tut="nav-frameworks"]',
            content: 'You can view the current CarML frameworks that service models through the frameworks page.',
          },
          {
            selector: '[data-tut="nav-models"]',
            content: 'All CarML model are available on the model page.',
          },
          {
            selector: '[data-tut="nav-about"]',
            content: 'Information about the motivation of CarML along with design descisions are documented.',
          },
          // ...
        ],
        e =>
          assignIn(e, {
            style: {
              ...e.style,
              '--reactour-accent': '#0db7c4',
            },
          })
      )

    toggleShowMore = () => {
      this.setState(prevState => ({
        isShowingMore: !prevState.isShowingMore,
      }))
    }

    closeModelSelector = () => {
      this.setState({ isModelSelectorOpen: false })
    }

    closeTour = () => {
      const { closeTutorial } = this.props
      closeTutorial()
      this.setState({ isTourOpen: false })
    }

    openTour = () => {
      this.setState({ isTourOpen: true })
    }

    onUploadSuccess = files => {
      const { predictInputsSet } = this.props
      const uploadURLs = values(files).map(file => file.uploadURL)
      predictInputsSet({ predictURLs: uploadURLs })
    }

    render() {
      const {
        agents,
        predictInputs,
        isPredicting,
        selectedModels,
        device,
        predictURLAdded,
        predictURLChanged,
        batchSizeChanged,
        deviceChanged,
        traceLevelChanged,
        agentChanged,
        inferenceButtonClicked,
        isTutorial,
      } = this.props

      const agentsDropdownData = map(uniqBy(agents, 'hostname'), agent => ({
        key: yeast(),
        text: agent.hostname,
        value: `${agent.host}`,
      }))

      const { isTourOpen, isModelSelectorOpen } = this.state
      return (
        <div>
          <Container
            text
            style={{
              fontFamily,
            }}
          >
            <Grid data-tut="select-model" data-tut2="select-tracelevel">
              <Grid.Row centered columns={1}>
                <ModelSelector open={isModelSelectorOpen} />
              </Grid.Row>
              <Grid.Row centered stretched>
                <Grid.Column width={4} style={{ paddingLeft: 0, paddingTop: '10px' }}>
                  <Checkbox
                    toggle
                    data-tut="select-accelerator"
                    checked={device === 'GPU'}
                    label={device === 'GPU' ? 'Using GPU' : 'Using CPU'}
                    onChange={() => {
                      if (device === 'GPU') {
                        deviceChanged({ device: 'CPU' })
                      } else {
                        deviceChanged({ device: 'GPU' })
                      }
                    }}
                  />
                </Grid.Column>
                <Grid.Column width={5}>
                  <Input
                    fluid
                    data-tut="select-batchsize"
                    placeholder="Batch Size (default: 1)"
                    onChange={e => batchSizeChanged({ batchSize: e.target.value })}
                  />
                </Grid.Column>
                <Grid.Column width={7} style={{ paddingRight: 0 }}>
                  <Dropdown
                    selection
                    options={trace_options}
                    placeholder="Trace Level (default: Full)"
                    onChange={(e, { value }) => {
                      traceLevelChanged({ traceLevel: value })
                    }}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row centered columns={1}>
                <Dropdown
                  selection
                  options={agentsDropdownData}
                  placeholder="Agent Selection (default: Random)"
                  onChange={(e, { value }) => agentChanged({ agent: value })}
                />
              </Grid.Row>
              <Grid.Row centered columns={1}>
                <Tab
                  menu={{ secondary: true, pointing: true }}
                  data-tut="select-datainput"
                  panes={[
                    {
                      menuItem: 'URL',
                      render: () => (
                        <div>
                          <Form
                            onSubmit={e => {
                              e.preventDefault()
                              predictURLAdded()
                            }}
                          >
                            <Input
                              fluid
                              placeholder="http://ww4.hdnux.com/photos/41/15/35/8705883/4/920x920.jpg"
                              onChange={e =>
                                predictURLChanged({
                                  predictURL: e.target.value,
                                })
                              }
                            />
                          </Form>
                          {isNil(predictInputs) ? null : (
                            <List>
                              {predictInputs.map((item, index) => (
                                <List.Item key={yeast()} index={index}>
                                  {item}
                                </List.Item>
                              ))}
                            </List>
                          )}
                        </div>
                      ),
                    },
                    {
                      menuItem: 'Upload',
                      render: () => <UploadArea onUploadSuccess={this.onUploadSuccess} />,
                    },
                    {
                      menuItem: 'Dataset',
                      render: () => (
                        <Dropdown placeholder="Select Dataset" fluid search selection options={datasetOptions} />
                      ),
                    },
                  ]}
                />
              </Grid.Row>
              <Divider horizontal />
              <Grid.Row centered columns={1} style={{ paddingTop: '2em' }}>
                <Container textAlign="center">
                  <Button
                    data-tut="select-predict"
                    as="a"
                    size="massive"
                    style={{
                      color: 'white',
                      backgroundColor: '#0DB7C4',
                      borderColor: '#0DB7C4',
                    }}
                    disabled={size(keys(selectedModels)) === 0}
                    onClick={() => {
                      if (isEmpty(predictInputs)) {
                        predictURLAdded()
                      }
                      inferenceButtonClicked()
                    }}
                  >
                    {isPredicting === true ? (
                      <Loader active inline inverted>
                        Predicting
                      </Loader>
                    ) : (
                      'Predict'
                    )}
                  </Button>
                </Container>
              </Grid.Row>
            </Grid>
          </Container>
          <Tour steps={this.steps()} isOpen={isTourOpen || isTutorial} onRequestClose={this.closeTour} />
        </div>
      )
    }
  }
)
