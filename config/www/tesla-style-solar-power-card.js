class TeslaStyleSolarPowerCard extends HTMLElement {

  set hass(hass) {

    if (!this.contentIsCreated) {
      this.createContent();

      var obj = this;
      requestAnimationFrame(function(timestamp){
        obj.updateCircle(timestamp);
      });
    }

    try {
      this.updateProperties(hass);
    } catch (err) {
      this.innerHTML = `
      <div class="acc_error">
        <b>${err}</b>
        <br><br>
        type: 'custom:tesla-style-solar-power-card'
      </div>`;
      this.style.padding = '8px';
      this.style.backgroundColor = '#ff353d';
      this.style.color = 'white';
    }

  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define "entity"');
    }

    this.config = config;

    this.SolarCardEntities = {
      houseConsumption: config.house_consumption_entity,
      solarYield: config.solar_yield_entity,
      gridConsumption: config.grid_consumption_entity,
      gridFeed: config.grid_feed_entity,
      batteryConsumption: config.battery_consumption_entity,
      batteryCharge: config.battery_charge_entity
    }

    this.topIcon = 'mdi:solar-panel-large';
    if (config.top_icon !== undefined) {
      this.topIcon = config.top_icon;
    }

    this.bottomIcon = 'mdi:battery-charging-50';
    if (config.bottom_icon !== undefined) {
      this.bottomIcon = config.bottom_icon;
    }

    this.leftIcon = 'mdi:transmission-tower';
    if (config.left_icon !== undefined) {
      this.leftIcon = config.left_icon;
    }

    this.rightIcon = 'mdi:home';
    if (config.right_icon !== undefined) {
      this.rightIcon = config.right_icon;
    }

    this.showLine = false;
    if (config.show_line) {
      this.showLine = true;
    }

    this.circleColor = "var(--primary-color)";
    if (config.circle_color !== undefined) {
      this.circleColor = config.circle_color;
    }
    this.goodColor = "#13ae13";

    this.contentIsCreated = false;

    this.speed = 0;
    this.startPosition = -10;
    this.maxPosition = 500;

    this.value = 0;
    this.unit_of_measurement = '';

    this.accText = undefined;
    this.houseConsumptionCircle = undefined;
    this.solarYieldCircle = undefined;
  }

  createContent(hass) {
    const card = document.createElement('ha-card');
    var content = document.createElement('div');
    content.style.padding = '16px';
    card.appendChild(content);
    this.appendChild(card);

    var houseConsumptionLine = '';
    if (true) {
      houseConsumptionLine = `<line x1="0" y1="20" x2="500" y2="20" style="stroke:var(--primary-text-color);" />`;
    }
    var solarYieldLine = `<line x1="0" y1="0" x2="0" y2="200" style="stroke:var(--primary-text-color);" />`;
    var batteryLine = `<line x1="0" y1="0" x2="0" y2="200" style="stroke:var(--primary-text-color);" />`;


    content.innerHTML = `
<style>
.acc_container {
    height: 50px;
    width: 50px;
    border: 1px solid black;
    border-radius: 100px;
    padding: 22px;
    color: var(--primary-text-color);
    border-color: var(--primary-text-color);
}
.acc_icon {
    --mdc-icon-size: 50px;
    height: 50px;
    width: 50px;
}
.acc_text_container {
    position: relative;
    left: 14px;
    top: -29px;
    width: 70px;
}
.acc_text {
    text-align: center;
}
.acc_td {
    vertical-align: top;
}
.acc_center .acc_td{
  width:auto;
}
.acc_left {
  vertical-align: top;
  float:left;
  z-index:5;
}
.acc_right {
  float:right;
  z-index:5;
}
.acc_top .acc_container, .acc_bottom .acc_container{
    margin:auto;
}
.acc_line{
  position:absolute;
  padding-top:40px;
}

.house_consumption{
  padding-left: 47%;
  padding-right: 40px;
  width:28%;
}

.grid_consumption{
  padding-left: 95px;
  padding-right: 34%;
  width:27%;
}
.solar_yield{
  margin: auto;
  padding-top: 0px;
  height: 100%;    
  padding-left: 45%;
}

.battery{
  margin: auto;
  padding-top: 50px;
  height: 64%;
  padding-left: 45%;
}

br.clear {
  clear:both;
}
</style>
<div class="tesla-style-power-card">
  <div class="acc_top">
      <div class="acc_container">
            <ha-icon class="acc_icon" icon="${ this.topIcon }"></ha-icon>
      </div>
  </div>
  <div class="acc_line solar_yield">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20px"
        height="100%"
        viewBox="0 0 40 700"
        preserveAspectRatio="xMinYMax slice"
      >
        ${solarYieldLine}
      </svg>
    </div>
    
<div class="acc_center">
    <div class="acc_td acc_left">
        <div class="acc_container">
              <ha-icon class="acc_icon" icon="${ this.leftIcon }"></ha-icon>
        </div>
    </div>
    <div class="acc_line grid_consumption">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="20px"
        viewBox="0 0 500 40"
        preserveAspectRatio="xMinYMax slice"
      >
        ${houseConsumptionLine}
      </svg>
    </div>
    <div class="acc_line house_consumption">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="20px"
        viewBox="0 0 500 40"
        preserveAspectRatio="xMinYMax slice"
      >
        ${houseConsumptionLine}
      </svg>
    </div>

    <div class="acc_line battery">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20px"
        height="100%"
        viewBox="0 0 40 500"
        preserveAspectRatio="xMinYMax slice"
      >
        ${batteryLine}
      </svg>
    </div>
    <div class="acc_td acc_right">
        <div class="acc_icon_with_text">
            <div class="acc_container">
                <ha-icon class="acc_icon" icon="${ this.rightIcon }"></ha-icon>
            </div>
            <div class="acc_text_container">
            </div>
        </div>
    </div>
</div>
<br class="clear">
  <div class="acc_bottom">
    <div class="acc_container">
          <ha-icon class="acc_icon" icon="${ this.bottomIcon }"></ha-icon>
    </div>
  </div>
</div>
    `;

    this.accText = document.createElement('div');
    this.accText.className = 'acc_text';
    card.querySelectorAll(".acc_text_container").item(0).appendChild(this.accText);

    this.houseConsumptionCircle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    this.houseConsumptionCircle.setAttributeNS(null, "r", "10");
    this.houseConsumptionCircle.setAttributeNS(null, "cx", this.startPosition);
    this.houseConsumptionCircle.setAttributeNS(null, "cy", "20");
    this.houseConsumptionCircle.setAttributeNS(null, "fill", this.circleColor);
    this.querySelectorAll(".house_consumption svg").item(0).appendChild(this.houseConsumptionCircle);

    this.gridConsumptionCircle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    this.gridConsumptionCircle.setAttributeNS(null, "r", "10");
    this.gridConsumptionCircle.setAttributeNS(null, "cx", this.startPosition);
    this.gridConsumptionCircle.setAttributeNS(null, "cy", "20");
    this.gridConsumptionCircle.setAttributeNS(null, "fill", this.circleColor);
    this.querySelectorAll(".grid_consumption svg").item(0).appendChild(this.gridConsumptionCircle);

    this.solarYieldCircle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    this.solarYieldCircle.setAttributeNS(null, "r", "10");
    this.solarYieldCircle.setAttributeNS(null, "cy", this.startPosition);
    this.solarYieldCircle.setAttributeNS(null, "cx", "20");
    this.solarYieldCircle.setAttributeNS(null, "fill", this.goodColor);
    this.querySelectorAll(".solar_yield svg").item(0).appendChild(this.solarYieldCircle);
    this.contentIsCreated = true;
  }

  updateProperties(hass) {

    for (var prop in this.SolarCardEntities) {
      if (Object.prototype.hasOwnProperty.call(this.SolarCardEntitie, prop)) {
        console.log(prop);
        var entityObj = Object;
        entityObj.entity = prop;
        entityObj.value = this.getStateValue(hass, prop);
        entityObj.unit_of_measurement = 'kW';
        entityObj.accText.innerHTML = prop.value + ' ' + entityObj.unit_of_measurement;
        entityObj.speed = this.getSpeed(prop.value);
        if (entityObj.speed === 0) {
          entityObj.currentPosition = this.startPosition;
        }
      }
    }
    console.log(this.SolarCardEntities);
    /*
    this.value = this.getStateValue(hass, this.config.entity);
    this.unit_of_measurement = 'kW';
    this.accText.innerHTML = this.value + ' ' + this.unit_of_measurement;
    this.speed = this.getSpeed(this.value);
    if (this.speed === 0) {
      this.currentPosition = this.startPosition;
    }
    */
    this.SolarYieldSpeed = this.getSpeed(this.value);
  }

  getStateValue(hass, EntityId){
    const entityId = EntityId;
    const state = hass.states[entityId];

    if (state) {
        var valueStr = state.state;
        const unit_of_measurement = state.attributes.unit_of_measurement;

        if (unit_of_measurement === 'kW') {
          value = valueStr * 1;
        } else if (unit_of_measurement === 'W') {
          value = valueStr / 1000;
        } else {
          throw new Error('This card can work only with entities that has unit_of_measurement "W" or "kW"');
        }

        if (value > 0.2) {
          value = Math.round(value * 10) / 10
        } else {
          value = Math.round(value * 1000) / 1000
        }
    }

    return value;
  }

  updateCircle(timestamp) {

    if (this.clientWidth !== 0) {
      this.maxPosition = 2 * this.clientWidth - 570;
    }

    if (this.currentPosition === undefined) {
      this.currentPosition = this.startPosition;
    }

    if (this.prevTimestamp === undefined) {
      this.prevTimestamp = timestamp;
    }

    var timePassed = timestamp - this.prevTimestamp;
    var deltaPosition = this.speed * timePassed;
    this.currentPosition += deltaPosition;

    if (this.currentPosition > this.maxPosition) {
        this.currentPosition = this.startPosition;
    }

    this.prevTimestamp = timestamp;

    this.houseConsumptionCircle.setAttributeNS(null, "cx", this.currentPosition);
    this.gridConsumptionCircle.setAttributeNS(null, "cx", this.currentPosition);
    this.solarYieldCircle.setAttributeNS(null, "cy", this.currentPosition);

    var obj = this;
    requestAnimationFrame(function(timestamp){
      obj.updateCircle(timestamp);
    });
  }

  getSpeed(value) {

    var speed = 0;

    // I have found min & max speed that looks ok to me.
    // And then I have calculated math function
    // using the dots:
    //
    // value    speed
    // 0.001    0.02
    // 15       2

    if (this.value > 0) {
      speed = 0.1320 * this.value + 0.02;
    }

    return speed;
  }

}

customElements.define('tesla-style-solar-power-card', TeslaStyleSolarPowerCard);