class TeslaStyleSolarPowerCard extends HTMLElement {
  cardRoot;

  set hass(hass) {
    if (!this.contentIsCreated) {

      this.createContent();

      var obj = this;

      requestAnimationFrame(function(timestamp){
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
    if (!config.entity) {
      throw new Error('You need to define "entity"');
    }
    this.config = config;
    this.pxRate = 3;
    var pxRate = this.pxRate;

    class sensorCardData {
      constructor(){
        this.speed = 0;
        this.startPosition= 0;
        this.currentPosition = 0;
        this.currentDelta = 0;
        this.maxPosition = pxRate * 10;
        this.value = 0;
        this.unit_of_measurement = '';
        this.accText = document.createElement('div');
        this.accText.className = 'accText';
        this.entity = null;
        this.circle = null;
        this.circleColor = "var(--primary-color)";
        this.prevTimestamp = undefined;
        this.backwardsMovement = false;
        this.line = null;
      }
    }

    this.counter = 1;

    this.solarCardElements = {
      houseConsumption: new sensorCardData(),
      solarConsumption: new sensorCardData(),
      gridConsumption: new sensorCardData(),
      batteryConsumption: new sensorCardData(),
      solarYield: new sensorCardData(),
      gridFeedIn: new sensorCardData(),
      batteryCharge: new sensorCardData(),
      batteryCharging: new sensorCardData(),
    }

    this.solarCardElements.houseConsumption.entity = config.house_consumption_entity;

    this.solarCardElements.solarYield.entity = config.solar_yield_entity;

    this.solarCardElements.gridConsumption.entity = config.grid_consumption_entity;
    this.solarCardElements.gridConsumption.circleColor = "#326342";
    
    this.solarCardElements.gridFeedIn.entity = config.grid_feed_in_entity;
    this.solarCardElements.gridFeedIn.circleColor = "#326342";
    
    this.solarCardElements.batteryConsumption.entity = config.battery_consumption_entity;
    this.solarCardElements.batteryConsumption.circleColor = "#326342";

    this.solarCardElements.batteryCharging.entity = config.battery_charging_entity;
    this.solarCardElements.batteryCharging.circleColor = "#326342";
    
    this.solarCardElements.solarConsumption.entity = config.solar_consumption_entity;
    this.solarCardElements.solarConsumption.circleColor = "#326342";
    
    //this.solarCardElements.house_consumption.entity = config.battery_consumption_consumption_entity;
    //this.solarCardElements.battery_charge.entity = config.battery_charge_entity;
    //this.solarCardElements.solar_yield.entity = config.solar_yield_entity;

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

    content.innerHTML = `
<style>
.tesla-style-solar-power-card{
  margin:auto;
  display:table;
}
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
.solar_icon_container {
  border: 1px solid var(--warning-color);
}
.solar_icon_container .acc_icon{
  color: var(--warning-color);
}
.battery_icon_container{
  border: 1px solid var(--success-color);
}
.battery_icon_container .acc_icon{
  color: var(--success-color);
}
.house_icon_container{
  border: 1px solid var(--info-color);
}
.house_icon_container .acc_icon{
  color: var(--info-color);
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
}
#battery_consumption_line, #solar_consumption_line, #grid_consumption_line, #battery_charging_line, #grid_feed_in_line{
  stroke:var(--primary-color);
  fill:none;
  stroke-width:1;
}
#grid_consumption_line{
  stroke-width:1;
}
#solar_consumption_line, #grid_feed_in_line{
  stroke:var(--success-color);
}
#battery_consumption_line, #battery_charging_line{
  stroke:var(--warning-color);
}


br.clear {
  clear:both;
}
</style>
<div class="tesla-style-solar-power-card">
  <div class="acc_top">
      <div class="acc_container solar_icon_container">
            <ha-icon class="acc_icon" icon="${ this.topIcon }"></ha-icon>
      </div>
  </div>
  <div class="acc_line solar_consumption">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20px"
        height="100%"
        viewBox="0 0 40 `+ this.pxRate * 10 + `"
        preserveAspectRatio="xMinYMax slice"
      >
      </svg>
    </div>
  <div class="acc_line grid_feed_in">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20px"
      height="100%"
      viewBox="0 0 40 `+ this.pxRate * 10 + `"
      preserveAspectRatio="xMinYMax slice"
    >
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
        viewBox="0 0 `+ this.pxRate * 10 + ` 40"
        preserveAspectRatio="xMinYMax slice"
      >
      </svg>
    </div>
    <div class="acc_line house_consumption">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50%"
        height="20px"
        viewBox="0 0 `+ this.pxRate * 10 + ` 40"
        preserveAspectRatio="xMinYMax slice"
      >
      </svg>
    </div>
    <div class="acc_line battery_charging">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20px"
        height="50%"
        viewBox="0 0 40 `+ this.pxRate * 10 + `"
        preserveAspectRatio="xMinYMax slice"
      >
      </svg>
    </div>
    <div class="acc_line battery_consumption">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20px"
        height="50%"
        viewBox="0 0 40 `+ this.pxRate * 10 + `"
        preserveAspectRatio="xMinYMax slice"
      >
      </svg>
    </div>
    <div class="acc_td acc_right">
        <div class="acc_icon_with_text">
            <div class="acc_container house_icon_container">
                <ha-icon class="acc_icon" icon="${ this.rightIcon }"></ha-icon>
            </div>
            <div class="acc_text_container">
            </div>
        </div>
    </div>
</div>
<br class="clear">
  <div class="acc_bottom">
    <div class="acc_container battery_icon_container">
          <ha-icon class="acc_icon" icon="${ this.bottomIcon }"></ha-icon>
    </div>
    <div class="acc_text_container></div>
  </div>
</div>
    `;

    this.accText = document.createElement('div');
    this.accText.className = 'acc_text';
    card.querySelectorAll(".acc_text_container").item(0).appendChild(this.accText);

    this.createCircleAndLine(this.solarCardElements.solarConsumption, "solar_consumption", "M5,5 C5,109 5,105 105,105");

    this.createCircleAndLine(this.solarCardElements.gridConsumption, "grid_consumption", "M100,10 C10,109 10,105 105,105");

    this.createCircleAndLine(this.solarCardElements.batteryCharging, "battery_charging", "M10,10 C10,10 105,10 105,10");

    this.createCircleAndLine(this.solarCardElements.gridFeedIn, "grid_feed_in", "M101,9 C100,101 99,106 10,102");

    this.createCircleAndLine(this.solarCardElements.batteryConsumption, "battery_consumption", "M100,10 C10,109 10,105 105,105");
    

    this.contentIsCreated = true;
  }

  updateProperties(hass) {
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
  }

  createCircleAndLine(entity, cssSelector, pathDAttribute){
    entity.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = entity.circle;
    circle.setAttributeNS(null, "r", "5");
    circle.setAttributeNS(null, "cx", entity.startPosition);
    circle.setAttributeNS(null, "cy", "5");
    circle.setAttributeNS(null, "fill", entity.circleColor);
    circle.setAttributeNS(null, "id", cssSelector+"_circle");
    this.querySelector("." + cssSelector + " svg").appendChild(circle);
    entity.line = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    entity.line.setAttributeNS(null, "d", pathDAttribute);
    entity.line.setAttributeNS(null, 'id', cssSelector+"_line");
    this.querySelector("." + cssSelector + " svg").appendChild(entity.line);
  }

  changeStylesDependingOnWidth(newWidth){
    this.oldWidth = newWidth;
    this.pxRate = newWidth / 100;
    var pxRate = this.pxRate;

    //console.log('width: ' + newWidth + ' multiplier:' + this.pxRate);
    this.cardRoot = document.querySelector('home-assistant').shadowRoot.querySelector('home-assistant-main').shadowRoot.querySelector('ha-panel-lovelace').shadowRoot.querySelector('hui-root').shadowRoot.querySelector('hui-view').shadowRoot.querySelector('tesla-style-solar-power-card ha-card');


    this.cardRoot.querySelector('.tesla-style-solar-power-card').style['width'] = 90 * pxRate + 'px';
    this.cardRoot.querySelector('.tesla-style-solar-power-card').style['height'] = 90 * pxRate + 'px';


    var iconContainer = this.cardRoot.querySelectorAll('.acc_container');
    iconContainer.forEach(
      function(currentValue, currentIndex, iconObj){
        iconObj[currentIndex].style["height"] = 10 * pxRate + 'px';
        iconObj[currentIndex].style["width"] = 10 * pxRate + 'px';
        iconObj[currentIndex].style["padding"] = 7 * pxRate + 'px';        
      }
    );

    var icons = this.cardRoot.querySelectorAll('ha-icon');
    icons.forEach(
      function(currentValue, currentIndex, listObj){
        //console.log(listObj[currentIndex]);
        listObj[currentIndex].shadowRoot.querySelector('ha-svg-icon').style["height"] = 10 * pxRate + 'px';       
        listObj[currentIndex].shadowRoot.querySelector('ha-svg-icon').style["width"] = 10 * pxRate + 'px';       
      }
    );

    this.cardRoot.querySelector('.acc_top').style['padding-bottom'] = 9 * pxRate + 'px';
    this.cardRoot.querySelector('.acc_bottom').style['padding-top'] = 9 * pxRate + 'px';

    let lineSize = 22 * pxRate;

    this.correctDimensionsOfCircleLineAndContainer('battery_consumption', 23 * pxRate, 23 * pxRate, 44 * pxRate, 11 * pxRate, 'M5,'+ 22 * pxRate +' C10,10 10,10 '+22 * pxRate+',10');

    this.correctDimensionsOfCircleLineAndContainer('solar_consumption', 23 * pxRate, 23 * pxRate, 44 * pxRate, -9.5 * pxRate, 'M5,5 C5,'+ lineSize +' 5,'+ lineSize +' '+lineSize+','+lineSize);
  
    this.correctDimensionsOfCircleLineAndContainer('grid_feed_in',23 * pxRate, 23 * pxRate, 23 * pxRate,  -9.5 * pxRate, 'M'+ lineSize +',5 C'+ lineSize +','+ lineSize +' '+ lineSize +','+ lineSize +' 5,'+ lineSize);
    
    this.correctDimensionsOfCircleLineAndContainer('grid_consumption', 2 * pxRate, 43.5 * pxRate, 23 * pxRate, 9.5 * pxRate, 'M5,5 C5,5 '+ lineSize * 2 +',5 '+ lineSize*2 +',5');

    this.correctDimensionsOfCircleLineAndContainer('battery_charging',  44 * pxRate, 2 * pxRate, 44 * pxRate, -10 * pxRate, 'M5,5 C5,5 5,'+ lineSize * 2 +' 5,'+ lineSize*2);
  }

  correctDimensionsOfCircleLineAndContainer(cssClass, height, width, left, top, pathDAttribute){
    //console.log(cssClass);
    this.cardRoot.querySelector("." + cssClass).style['height'] = height + 'px';
    this.cardRoot.querySelector("." + cssClass).style['width'] = width + 'px';
    this.cardRoot.querySelector("." + cssClass).style['margin-left'] = left + 'px';
    this.cardRoot.querySelector("." + cssClass).style['margin-top'] = top + 'px';
    this.cardRoot.querySelector("." + cssClass +' svg').setAttribute('height', height);
    this.cardRoot.querySelector("." + cssClass +' svg').setAttribute('width', width);
    this.cardRoot.querySelector("." + cssClass +' svg').setAttribute("viewBox", "0 0 "+ width + " " + height); 
    this.cardRoot.querySelector("#" + cssClass +'_line').setAttribute('d',pathDAttribute);
  }

  updateAllCircles(timestamp){
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

  updateOneCircle(timestamp, entity) {

    if(entity.line == undefined) return;

    if(entity.speed == 0){
      entity.circle.setAttribute('visibility', 'hidden');
      return;
    } else{
      entity.circle.setAttribute('visibility', 'visible');
    }

    if (entity.prevTimestamp === undefined) {
      entity.prevTimestamp = timestamp;
    }
    let LineLength = entity.line.getTotalLength();
    
    if (entity.prevTimestamp === undefined) {
      entity.prevTimestamp = timestamp;
    }
    var timePassed = timestamp - entity.prevTimestamp;
    var delta = entity.speed * timePassed;
    entity.currentDelta += delta;

    let percentageDelta = entity.currentDelta / LineLength;
    
    if (percentageDelta >= 1) {
      entity.currentDelta = 0;
      percentageDelta = 0.01;
    }

    let point = entity.line.getPointAtLength(LineLength * percentageDelta);
    
    entity.circle.setAttributeNS(null, "cx", point.x);
    entity.circle.setAttributeNS(null, "cy", point.y);

    entity.prevTimestamp = timestamp;

  }
  


  setPosition(perc){
    //the distance on the path where to place the little circle
    let dist = ellTotalLength * perc; 
    //get the position of a point at the distance dist on the path 
    let point = ell.getPointAtLength(dist);
    // set the values of the cx and cy attributes of the little circle
    circ.setAttributeNS(null, "cx", point.x);
    circ.setAttributeNS(null, "cy", point.y);  
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

  getSpeed(value) {

    var speed = 0;

    if (value > 0) {
      speed = 0.08 * value;
    }

    return speed;
  }

}

customElements.define('tesla-style-solar-power-card', TeslaStyleSolarPowerCard);