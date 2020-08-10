class TeslaStyleSolarPowerCard extends HTMLElement {

  set hass(hass) {
    if (!this.contentIsCreated) {

      this.createContent();

      var obj = this;

      //console.log(' in hass client Width:' + this.clientWidth);

      requestAnimationFrame(function(timestamp){
        //console.log(' in hass client Width:' + obj.clientWidth);
        obj.updateAllCircles(timestamp);
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
    //console.log("setting config");
    if (!config.entity) {
      throw new Error('You need to define "entity"');
    }
    this.config = config;

    class sensorCardData {
      constructor(){
        this.speed = 0;
        this.startPosition= -10;
        this.currentPosition = -10;
        this.maxPosition = 500;
        this.value = 0;
        this.unit_of_measurement = '';
        this.accText = document.createElement('div');
        this.accText.className = 'accText';
        this.entity = null;
        this.circleColor = "var(--primary-color)";
        this.prevTimestamp = undefined;
        this.backwardsMovement = false;
      }

      moveCircle(nextPosition){
          //overridden by each element
      }
    }

    this.counter = 1;

    this.solarCardElements = {
      houseConsumption: new sensorCardData(),
      solarYield: new sensorCardData(),
      gridConsumption: new sensorCardData(),
      gridFeed: new sensorCardData(),
      batteryConsumption: new sensorCardData(),
      //batteryCharge: new sensorCardData(),
    }

    this.solarCardElements.houseConsumption.entity = config.house_consumption_entity;
    this.solarCardElements.houseConsumption.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cx", entity.currentPosition);
    }
    this.solarCardElements.solarYield.entity = config.solar_yield_entity;
    this.solarCardElements.solarYield.circleColor = "#326342";
    this.solarCardElements.solarYield.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cy", entity.currentPosition);
    }
    this.solarCardElements.gridConsumption.entity = config.grid_consumption_entity;
    this.solarCardElements.gridConsumption.circleColor = "#326342";
    this.solarCardElements.gridConsumption.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cx", entity.currentPosition);
    }
    this.solarCardElements.gridFeed.entity = config.grid_feed_in_entity;
    this.solarCardElements.gridFeed.circleColor = "#326342";
    this.solarCardElements.gridFeed.backwardsMovement = true;
    this.solarCardElements.gridFeed.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cx", entity.currentPosition);
    }
    this.solarCardElements.batteryConsumption.entity = config.battery_consumption_entity;
    this.solarCardElements.batteryConsumption.circleColor = "#326342";
    this.solarCardElements.batteryConsumption.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cy", entity.currentPosition);
    }
    //this.solarCardElements.gridConsumption.entity = config.grid_consumption_entity;
    //this.solarCardElements.gridFeed.entity = config.grid_feed_entity;
    //this.solarCardElements.batteryConsumption.entity = config.battery_consumption_entity;
    //this.solarCardElements.batteryCharge.entity = config.battery_charge_entity;

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
    
    this.oldWidth = 0;
    this.contentIsCreated = false
  }

  createContent(hass) {
    const card = document.createElement('ha-card');
    var content = document.createElement('div');
    content.style.padding = '16px';
    card.appendChild(content);
    this.appendChild(card);

    this.iconSize = this.multiplier * 8;
    this.iconPadding = this.multiplier * 6;

    var houseConsumptionLine = '';
    if (true) {
      houseConsumptionLine = `<line x1="0" y1="20" x2="500" y2="20" style="stroke:var(--primary-text-color);" />`;
    }
    var solarYieldLine = `<line x1="0" y1="0" x2="0" y2="200" style="stroke:var(--primary-text-color);" />`;
    var batteryLine = `<line x1="0" y1="0" x2="0" y2="200" style="stroke:var(--primary-text-color);" />`;


    content.innerHTML = `
<style>
.acc_container {
    height: 40px;
    width: 40px;
    border: 1px solid black;
    border-radius: 100px;
    padding: 22px;
    color: var(--primary-text-color);
    border-color: var(--primary-text-color);
}
.acc_icon {
    --mdc-icon-size: 40px;
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
  position:relative;
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
        width="50%"
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
        height="50%"
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

    this.solarCardElements.solarYield.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = this.solarCardElements.solarYield.circle;
    circle.setAttributeNS(null, "r", "10");
    circle.setAttributeNS(null, "cx", "20");
    circle.setAttributeNS(null, "cy", this.solarCardElements.solarYield.startPosition);
    circle.setAttributeNS(null, "fill", this.solarCardElements.solarYield.circleColor);
    this.querySelectorAll(".solar_yield svg").item(0).appendChild(circle);
    
    this.solarCardElements.houseConsumption.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = this.solarCardElements.houseConsumption.circle;
    circle.setAttributeNS(null, "r", "10");
    circle.setAttributeNS(null, "cx", this.solarCardElements.houseConsumption.startPosition);
    circle.setAttributeNS(null, "cy", "20");
    circle.setAttributeNS(null, "fill", this.solarCardElements.houseConsumption.circleColor);
    this.querySelectorAll(".house_consumption svg").item(0).appendChild(circle);

    this.solarCardElements.gridConsumption.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = this.solarCardElements.gridConsumption.circle;
    circle.setAttributeNS(null, "r", "10");
    circle.setAttributeNS(null, "cx", this.solarCardElements.gridConsumption.startPosition);
    circle.setAttributeNS(null, "cy", "20");
    circle.setAttributeNS(null, "fill", this.solarCardElements.gridConsumption.circleColor);
    this.querySelectorAll(".grid_consumption svg").item(0).appendChild(circle);

    this.solarCardElements.gridFeed.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = this.solarCardElements.gridFeed.circle;
    circle.setAttributeNS(null, "r", "10");
    circle.setAttributeNS(null, "cx", this.solarCardElements.gridFeed.startPosition);
    circle.setAttributeNS(null, "cy", "20");
    circle.setAttributeNS(null, "fill", this.solarCardElements.gridFeed.circleColor);
    this.querySelectorAll(".grid_consumption svg").item(0).appendChild(circle);

    this.solarCardElements.batteryConsumption.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = this.solarCardElements.batteryConsumption.circle;
    circle.setAttributeNS(null, "r", "10");
    circle.setAttributeNS(null, "cx", "20");
    circle.setAttributeNS(null, "cy", this.solarCardElements.batteryConsumption.startPosition);
    circle.setAttributeNS(null, "fill", this.solarCardElements.batteryConsumption.circleColor);
    this.querySelectorAll(".battery svg").item(0).appendChild(circle);

    

    this.contentIsCreated = true;
  }

  updateProperties(hass) {
    //console.log("calling this.updateProperties solarCard Elements")
    //console.log(this.solarCardElements);
    //console.log(' in updateProperties clientWidth:' + this.clientWidth);

    for (var prop in this.solarCardElements) {
      if (Object.prototype.hasOwnProperty.call(this.solarCardElements, prop)) {
        this.solarCardElements[prop].value = this.getStateValue(hass, this.solarCardElements[prop].entity);
        this.solarCardElements[prop].unit_of_measurement = 'kW';
        this.solarCardElements[prop].accText.innerHTML = this.solarCardElements[prop].value + ' ' + this.solarCardElements[prop].unit_of_measurement;
        this.solarCardElements[prop].speed = this.getSpeed(this.solarCardElements[prop].value);
        if (this.solarCardElements[prop].speed === 0) {
          this.solarCardElements[prop].currentPosition = this.solarCardElements[prop].startPosition;
        }
      }
    }
    //console.log(this.solarCardElements);
  }

  getStateValue(hass, entityId){
    const state = hass.states[entityId];

    if (state) {
        var valueStr = state.state;
        const unit_of_measurement = state.attributes.unit_of_measurement;

        var value;
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
    //console.log(entityId +" entity value: " + value);
    return value;
  }

  updateAllCircles(timestamp){
    //console.log(' in updateAllCircles clientWidth:' + this.clientWidth);
    //console.log("timestamp alone: " + timestamp);
    for (var prop in this.solarCardElements) {
      if (Object.prototype.hasOwnProperty.call(this.solarCardElements, prop)) {
        //console.log("calling this.updateAllCircles "+ prop);
        this.updateOneCircle(timestamp, this.solarCardElements[prop])
      }
    }

    if(this.oldWidth != this.clientWidth && document.readyState === "complete") {
      this.changeStylesDependingOnWidth(this.clientWidth);
    }

    //if(this.counter < 1000){
      var obj = this;
      //this.counter++;
      requestAnimationFrame(function(timestamp){
        obj.updateAllCircles(timestamp);
      });
    //}
  }

  changeStylesDependingOnWidth(newWidth){
    this.oldWidth = newWidth;
    var pixelMultiplier = Math.round(newWidth / 100);
    //console.log(document);
    this.cardRoot = document.querySelector('home-assistant').shadowRoot.querySelector('home-assistant-main').shadowRoot.querySelector('ha-panel-lovelace').shadowRoot.querySelector('hui-root').shadowRoot.querySelector('hui-view').shadowRoot.querySelector('tesla-style-solar-power-card ha-card');

    var icons = this.cardRoot.querySelectorAll('.acc_container');
    console.log(icons);
    icons.forEach(
      function(currentValue, currentIndex, icon){
        console.log(icon);
        icon.style.height = 10 * pixelMultiplier;
        icon.style.width = 10 * pixelMultiplier;
        icon.style.padding = 7 * pixelMultiplier;
      }
    );
    //icons.style.iconSize = 10*pixelMultiplier;
    
    //console.log("testing query selector: " + document.readyState);
  }

  updateOneCircle(timestamp, entity) {
    //console.log('updatingOneCircle speed:' + entity.speed + " maxpos:" + entity.maxPosition);
    //console.log('updatingOneCircle beg pos:' + entity.currentPosition);
    //console.log('client Width:' + this.clientWidth);
    if (this.clientWidth !== 0) {
      entity.maxPosition = 2 * this.clientWidth - 570;
    }

    if (entity.prevTimestamp === undefined) {
      entity.prevTimestamp = timestamp;
    }

    var timePassed = timestamp - entity.prevTimestamp;
    var deltaPosition = entity.speed * timePassed;
    if(!entity.backwardsMovement){
      if (entity.currentPosition === undefined) {
        entity.currentPosition = entity.startPosition;
      }

      entity.currentPosition += deltaPosition;

      if (entity.currentPosition > entity.maxPosition) {
        entity.currentPosition = entity.startPosition;
      }
    } else {
      if (entity.currentPosition === undefined) {
        entity.currentPosition = entity.maxPosition;
      }
      entity.currentPosition -= deltaPosition;

      if (entity.currentPosition < entity.startPosition) {
        entity.currentPosition = entity.maxPosition;
      }
    }

    entity.prevTimestamp = timestamp;

    //console.log('updatingOneCircle end pos:' + entity.currentPosition);
    entity.moveCircle(entity.currentPosition, entity);
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

    if (value > 0) {
      speed = 0.1320 * value + 0.02;
    }

    return speed;
  }

}

customElements.define('tesla-style-solar-power-card', TeslaStyleSolarPowerCard);
document.addEventListener("DOMContentLoaded", function(event) {
  console.log("now we are lloadad");
});