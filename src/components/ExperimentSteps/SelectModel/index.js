import SelectableCard from "../SelectableCard/index";
import React, { Component } from "react";
import { Col, Row, Layout, Icon, Divider, Dropdown, Menu } from "antd";
import yeast from "yeast";
import { withRouter } from "react-router-dom";
import {
  map,
  isArray,
  keys,
  uniqBy,
  filter,
  find,
  findIndex,
  isNil,
  truncate,
  size
} from "lodash";
import { ModelManifests } from "../../../swagger";
import { ExperimentContext } from "../../../context/ExperimentContext";

const { Content } = Layout;

function typeRender({ type }) {
  if (type === "image") {
    return <Icon key={yeast()} type="picture" />;
  }
  if (type === "feature") {
    return <Icon key={yeast()} type="appstore" />;
  }
  if (type === "text") {
    return <Icon key={yeast()} type="file-text" />;
  }
  if (type === "audio") {
    return <Icon key={yeast()} type="sound" />;
  }
  return <Icon key={yeast()} type="cluster" />;
}

class SelectModel extends Component {
  constructor(props) {
    super(props);
    this.handleSelect = this.handleSelect.bind(this);
    this.state = {
      loaded: false
    };
  }

  async componentDidMount() {
    if (this.props.context.modelManifests == null) {
      try {
        // todo: need to filter based on what is selected
        const req = await ModelManifests({
          frameworkName: "*",
          frameworkVersion: "*",
          modelName: "*",
          modelVersion: "*"
        });
        this.props.context.setModelManifests(req.manifests);
        this.setState({ loaded: true });
      } catch (err) {
        console.error(err);
      }
    }
  }

  handleSelect(isSelected, key) {
    const models = this.models;
    const model = models[key];
    if (isSelected) {
      const index = findIndex(
        this.props.context.models,
        e => e.name === model.name && e.version === model.version
      );
      this.props.context.removeModel(index);
      return;
    }
    this.props.context.addModel(model.name, model.version);
  }

  render() {
    if (!isArray(this.props.context.modelManifests)) {
      return <div />;
    }

    var models = this.props.context.modelManifests;
    const selectedFrameworks = this.props.context.frameworks;
    if (selectedFrameworks.length !== 0) {
      // find models with selected frameworks
      models = filter(models, function(o) {return findIndex(selectedFrameworks, o.framework) !== -1})
      models = filter(
        models,
        function(m) {
          return size(
            filter(models, function(o) { return m.name === o.name && m.version === o.version})
          ) === selectedFrameworks.length
        }
      )
    }
 
    models = uniqBy(
      models,
      e => e.name + e.version
    );

   console.log(models)

    const modelsKey = keys(models).sort();
    this.models = models;
    this.modelsKey = modelsKey;

    return (
      <Layout style={{ background: "#E8E9EB", margin: "0px 20px 120px 20px" }}>
        <Content>
          <div
            style={{
              background: "#1A263A",
              color: "white",
              paddingTop: "30px",
              paddingBottom: "60px"
            }}
          >
            <h2
              style={{ marginTop: "60px", marginLeft: "40px", color: "white" }}
            >
              Select a model
            </h2>
          </div>
          <Row gutter={16} type="flex" justify="space-around" align="middle">
            {modelsKey.map(key => {
              const model = models[key];
              // console.log(model);
              const isSelected = !isNil(
                find(
                  this.props.context.models,
                  e => e.name === model.name && e.version === model.version
                )
              );

              const menu = (
                <Menu>
                  <Menu.Item>int8</Menu.Item>
                  <Menu.Item>
                    {/* <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="http://www.alipay.com/"
                    > */}
                    float16
                    {/* </a> */}
                  </Menu.Item>
                  <Menu.Item>float32</Menu.Item>
                </Menu>
              );
              return (
                <Col
                  key={`model-${key}`}
                  sm={8}
                  xs={24}
                  style={{ paddingBottom: "10px", paddingTop: "10px" }}
                >
                  <SelectableCard
                    title={model.name + " V" + model.version}
                    content={truncate(model.description, {
                      length: 140,
                      separator: " "
                    })}
                    descriptionTitle={`${model.name} Information`}
                    description={model.description}
                    minHeight="200px"
                    onClick={() => this.handleSelect(isSelected, key)}
                    selected={isSelected}
                  >
                    <Row
                      onClick={e => e.stopPropagation()}
                      type="flex"
                      justify="end"
                      align="bottom"
                      style={{ color: "#aaa", fontSize: "10pt" }}
                    >
                      <Divider orientation="right">
                        <div style={{ color: "#aaa", fontSize: "10pt" }}>
                          Options
                        </div>
                      </Divider>
                      <Col span={8}>
                        ({map(model.inputs, typeRender)}) →{" "}
                        {typeRender(model.output)}
                      </Col>

                      <Col span={8} offset={8}>
                        <Dropdown overlay={menu}>
                          <>
                            data type <Icon type="down" />
                          </>
                        </Dropdown>
                      </Col>
                    </Row>
                  </SelectableCard>
                </Col>
              );
            })}
          </Row>
        </Content>
      </Layout>
    );
  }
}

export default withRouter(props => (
  <ExperimentContext.Consumer>
    {context => <SelectModel {...props} context={context} />}
  </ExperimentContext.Consumer>
));