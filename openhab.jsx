// http://10.0.0.44:8080/rest/events?topics=smarthome/items


class Item extends React.Component {
  constructor(props) {
    super(props);
    // default state of item. Is populated through an API request
    this.state = {};
  }

  label() {
    if ("label" in this.props) {
      return this.props.label
    }
    return this.props.name
  }

  refresh () {
    var url = "/rest/items/" + this.props.name;
    const that = this;
    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(jsonData) {
        that.setState( jsonData );
      });
  }

  setOpenhabState(state) {
    $.ajax({
      url: "/rest/items/" + this.props.name,
      type: 'POST',
      contentType: "text/plain",
      data: state.toString()
    });
    this.setState({ "state": state.toString() })
  }


  componentDidMount() {
    this.refresh();
    this.interval = setInterval(() => this.refresh(), 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div className="py-1">
        <span>
          {this.label()}
        </span>
        <span className="h6 float-right">
          {this.state.state} {this.props.unit}
        </span>
      </div>
    );
  }
}


class DimmerItem extends Item {
  constructor(props) {
    super(props);
    if (!("step" in this.props)) { this.props.step = 5; }
    if (!("max" in this.props)) { this.props.max = 100; }
    if (!("min" in this.props)) { this.props.min = 0; }
  }

  moveState(step) {
    var val = this.state.state - 1 + 1 + step;
    if (val > this.props.max) {
      val = this.props.max
    } else if (val < this.props.min) {
      val = this.props.min
    }
    this.setOpenhabState(val)
  }

  up() {
    this.moveState(this.props.step)
  }

  down() {
    this.moveState(-this.props.step)
  }

  render() {
    return (
      <div>
        <span className="align-text-top">
          {this.label()}
        </span>
        <span className="float-right">
          <span className="ml-auto h6 mr-2">
            {this.state.state} {this.props.unit}
          </span>
          <Reactstrap.ButtonGroup>
            <Reactstrap.Button color="light" onClick={() => this.up()}>
              <i className="fa fa-chevron-up" />
            </Reactstrap.Button>
            <Reactstrap.Button color="light" onClick={() => this.down()}>
              <i className="fa fa-chevron-down" />
            </Reactstrap.Button>
          </Reactstrap.ButtonGroup>
        </span>
      </div>
    );
  }
}


class SwitchItem extends Item {
  on() {
    this.setOpenhabState("ON")
  }

  off() {
    this.setOpenhabState("OFF")
  }

  render() {
    return (
      <div>
        <span className="align-text-top">
          {this.label()}
        </span>
        <span className="float-right">
          <Reactstrap.ButtonGroup>
            <Reactstrap.Button outline color="secondary" size="sm" active={this.state.state === "OFF"} onClick={() => this.off()}>
              OFF
            </Reactstrap.Button>
            <Reactstrap.Button outline color="dark" size="sm" active={this.state.state === "ON"} onClick={() => this.on()}>
              ON
            </Reactstrap.Button>
          </Reactstrap.ButtonGroup>
        </span>
      </div>
    );
  }
}


class ButtonGroupItem extends Item {

  buttons () {
    let btns = [];
    Object.keys(this.props.mapping).forEach(key => {
      let value = this.props.mapping[key];
      btns.push(
        <Reactstrap.Button outline
                           color="secondary"
                           size="sm"
                           active={this.state.state === key}
                           onClick={() => this.setOpenhabState(key)}>
          { value }
        </Reactstrap.Button>
      )
    });
    return btns;
  }

  render() {
    return (
      <div>
        <span className="align-text-top">
          {this.label()}
        </span>
        <span className="float-right">
          <Reactstrap.ButtonGroup>
            { this.buttons() }
          </Reactstrap.ButtonGroup>
        </span>
      </div>
    );
  }
}


class WebView extends React.Component {
  render () {
    return (
      <iframe src={ this.props.src }
              className="w-100 border-0"
      />
    )
  }
}

// Layout stuff

function columnMd(item) {
  return (
    <Reactstrap.Col md={6} className="py-1">
      {item}
    </Reactstrap.Col>
  )
}


function row(item1, item2) {
  return (
    <Reactstrap.Row>
      { columnMd(item1) }
      { columnMd(item2) }
    </Reactstrap.Row>
  )
}


function grid(items) {
  let n = items.length;
  // only one item? Do not make a grid (subject to change :D)
  if (n === 1) { return items[0]; }

  let rows = [];
  for (let i = 0; i < n/2; i++) {
      rows.push(row(items[2*i], items[2*i+1]))
  }
  return (
    <div>
      { rows }
    </div>
  )
}


class TabLayout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {"activeTab": '0'};
    console.log(this.props.items)
  }


  navItems(labels) {
    let nav = [];
    let i = 0;
    labels.forEach(label => {
      let idLabel = i.toString();
      nav.push(
        <Reactstrap.ListGroupItem active={ this.state.activeTab === idLabel }
                                  onClick={() => this.setState({ "activeTab": idLabel }) }>
          <span>
            {label} <i className="fa fa-chevron-right float-right text-secondary"/>
          </span>
        </Reactstrap.ListGroupItem>
      );
      i++
    });
    return nav
  }

  tabItems(labels) {
    let nav = [];
    let i = 0;
    labels.forEach(label => {
      let idLabel = i.toString();
      nav.push(
        <Reactstrap.TabPane tabId={idLabel}>
          { grid(this.props.items[label]) }
        </Reactstrap.TabPane>
      );
      i++
    });
    return nav
  }


  render() {
    return (
      <Reactstrap.Row>
        <Reactstrap.Col lg={4} className="mb-2">
          <Reactstrap.ListGroup>
            { this.navItems(Object.keys(this.props.items)) }
          </Reactstrap.ListGroup>
        </Reactstrap.Col>
        <Reactstrap.Col lg={8} className="mb-4">
          <Reactstrap.Card>
            <h5 className="card-header">
              { Object.keys(this.props.items)[this.state.activeTab] }
            </h5>
            <Reactstrap.CardBody>
              <Reactstrap.TabContent activeTab={ this.state.activeTab }>
                { this.tabItems(Object.keys(this.props.items)) }
              </Reactstrap.TabContent>
            </Reactstrap.CardBody>
          </Reactstrap.Card>
        </Reactstrap.Col>
      </Reactstrap.Row>
    )
  }

}


var tabData = {
  "Schlafzimmer": [
    <DimmerItem name="SchlafzimmerStehlampeOben" step={10} unit="%" label="Stehlampe (oben)"/>,
    <DimmerItem name="SchlafzimmerStehlampeUnten" step={10} unit="%" label="Stehlampe (unten)"/>,
    <DimmerItem name="Float" unit="%"/>,
    <SwitchItem name="Schrank" label="Schranklampe"/>,
    <SwitchItem name="Heizdecke"/>,
    <Item name="Temperature_Schlafzimmer" unit="°C" label="Temperatur"/>
  ],
  "Presence": [
    <SwitchItem name="Presence_iPhoneLara" label="Presence iPhone Lara"/>,
    <SwitchItem name="Presence_iPhoneTorben" label="Presence iPhone Torben"/>,
    <SwitchItem name="Presence_IFTTT_Torben" label="Presence IFTTT Torben"/>,
    <SwitchItem name="Presence_combined" label="Presence"/>
  ],
  "Sonstiges": [
    <DimmerItem name="PhasenanschnittFlur" step={10} unit="%" label="Licht Flur"/>,
    <ButtonGroupItem name="Heating_Mode" mapping={{ 0:"Normal", 1:"Urlaub", 2:"Zu Hause" }}/>
  ],
  "Chart": [
    <WebView src="/chart?channels=Wohnzimmer,Temperature_Wohnzimmer;Schlafzimmer,Temperature_Schlafzimmer;Bad,Temperature_Bad&since=168"/>
  ]
};


ReactDOM.render(
  <TabLayout items={ tabData }/>,
  document.getElementById('hello-example')
);
