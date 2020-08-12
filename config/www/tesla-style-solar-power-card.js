class TeslaStyleSolarPowerCard extends HTMLElement {
  cardRoot;

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
    this.pxRate = 3;
    var pxRate = this.pxRate;

    class sensorCardData {
      constructor(){
        this.speed = 0;
        this.startPosition= -10;
        this.currentPosition = -10;
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

      moveCircle(nextPosition){
          //overridden by each element
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

    this.solarCardElements.batteryCharging.entity = config.battery_consumption_entity;
    this.solarCardElements.batteryCharging.circleColor = "#326342";
    
    this.solarCardElements.solarConsumption.entity = config.solar_consumption_entity;
    this.solarCardElements.solarConsumption.circleColor = "#326342";
    
    //this.solarCardElements.gridConsumption.entity = config.grid_consumption_entity;
    //this.solarCardElements.gridFeedIn.entity = config.grid_feed_entity;
    //this.solarCardElements.battery_consumption.entity = config.battery_consumption_consumption_entity;
    //this.solarCardElements.barrery_charge.entity = config.battery_consumption_charge_entity;

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
      houseConsumptionLine = '';//`<line x1="0" y1="20" x2="500" y2="20" style="stroke:var(--primary-text-color);" />`;
    }
    //var solar_consumption_line = '<path id=solar_consumption_line d="M5,5 C5,109 5,105 105,105" />';//`<line x1="0" y1="0" x2="0" y2="200" style="stroke:var(--primary-text-color);" />`;
    //var battery_line = '<path id="battery_line" d="M5,110 C5,5 5,5 110,5" />';//`<line x1="0" y1="0" x2="0" y2="200" style="stroke:var(--primary-text-color);" />`;


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
#battery_consumption_line, #solar_consumption_line, #grid_consumption_line, #grid_feed_in_line{
  stroke:black;
  fill:none;
  stroke-width:2;
}
#grid_consumption_line{
  stroke-width:1;
}


br.clear {
  clear:both;
}
</style>
<div class="tesla-style-solar-power-card">
  <div class="acc_top">
      <div class="acc_container">
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

    this.createCircleAndLine(this.solarCardElements.solarConsumption, "solar_consumption", "M5,5 C5,109 5,105 105,105");

    this.createCircleAndLine(this.solarCardElements.gridConsumption, "grid_consumption", "M100,10 C10,109 10,105 105,105");

    this.createCircleAndLine(this.solarCardElements.batteryCharging, "battery_charging", "M10,10 C10,10 105,10 105,10");

    this.createCircleAndLine(this.solarCardElements.gridFeedIn, "grid_feed_in", "M101,9 C100,101 99,106 10,102");

    this.createCircleAndLine(this.solarCardElements.batteryConsumption, "battery_consumption", "M100,10 C10,109 10,105 105,105");
    

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

  createCircleAndLine(entity, cssSelector, pathDAttribute){
    entity.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = entity.circle;
    circle.setAttributeNS(null, "r", "5");
    circle.setAttributeNS(null, "cx", entity.startPosition);
    circle.setAttributeNS(null, "cy", "5");
    circle.setAttributeNS(null, "fill", entity.circleColor);
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

    /*this.cardRoot.querySelector('.house_consumption').style['height'] = '10px';
    this.cardRoot.querySelector('.house_consumption').style['width'] = 22 * pxRate + 'px';
    this.cardRoot.querySelector('.house_consumption').style['margin-left'] = 47 * pxRate + 'px';
    this.cardRoot.querySelector('.house_consumption').style['margin-top'] = 11 * pxRate + 'px';
    this.cardRoot.querySelector('.house_consumption svg').setAttribute('height', '10');
    this.cardRoot.querySelector('.house_consumption svg').setAttribute('width', 22 * pxRate);
    this.cardRoot.querySelector('.house_consumption svg').setAttribute("viewBox", "0 0 "+ 22 * pxRate + " 10"); */


    this.correctDimensionsOfCircleLineAndContainer('battery_consumption', 23 * pxRate, 23 * pxRate, 44 * pxRate, 12 * pxRate, 'M5,'+ 22 * pxRate +' C10,10 10,10 '+22 * pxRate+',10');


    /*this.cardRoot.querySelector('.solar_consumption').style['width'] = 23 * pxRate + 'px';
    this.cardRoot.querySelector('.solar_consumption').style['height'] = 23 * pxRate + 'px';
    this.cardRoot.querySelector('.solar_consumption').style['margin-left'] = 44 * pxRate + 'px';
    this.cardRoot.querySelector('.solar_consumption').style['margin-top'] = -9  * pxRate + 'px';
    this.cardRoot.querySelector('.solar_consumption svg').setAttribute('width', 22 * pxRate);
    this.cardRoot.querySelector('.solar_consumption svg').setAttribute('height', 23 * pxRate);
    this.cardRoot.querySelector('.solar_consumption svg').setAttribute("viewBox", "0 " + pxRate + ' ' + 22 * pxRate + ' ' + 23 * pxRate); 
    this.solarLine = this.cardRoot.querySelector('#solar_consumption_line');
    this.solarLine.setAttribute('d','M5,5 C5,'+ lineSize +' 5,'+ lineSize +' '+lineSize+','+lineSize);*/

    this.correctDimensionsOfCircleLineAndContainer('solar_consumption', 23 * pxRate, 23 * pxRate, 44 * pxRate, -9 * pxRate, 'M5,5 C5,'+ lineSize +' 5,'+ lineSize +' '+lineSize+','+lineSize);

    /*this.cardRoot.querySelector('.grid_feed_in').style['width'] = 23 * pxRate + 'px';
    this.cardRoot.querySelector('.grid_feed_in').style['height'] = 23 * pxRate + 'px';
    this.cardRoot.querySelector('.grid_feed_in').style['margin-left'] = 22 * pxRate + 'px';
    this.cardRoot.querySelector('.grid_feed_in').style['margin-top'] = -9  * pxRate + 'px';
    this.cardRoot.querySelector('.grid_feed_in svg').setAttribute('width', 22 * pxRate);
    this.cardRoot.querySelector('.grid_feed_in svg').setAttribute('height', 23 * pxRate);
    this.cardRoot.querySelector('.grid_feed_in svg').setAttribute("viewBox", "0 " + pxRate + ' ' + 22 * pxRate + ' ' + 23 * pxRate); 
    this.grid_feed_in_line = this.cardRoot.querySelector('#grid_feed_in_line');
    this.grid_feed_in_line.setAttribute('d','M'+ lineSize +',5 C'+ lineSize +','+ lineSize +' '+ lineSize +','+ lineSize +' 5,'+ lineSize);*/
    
    this.correctDimensionsOfCircleLineAndContainer('grid_feed_in',23 * pxRate, 23 * pxRate, 22 * pxRate,  -9 * pxRate, 'M'+ lineSize +',5 C'+ lineSize +','+ lineSize +' '+ lineSize +','+ lineSize +' 5,'+ lineSize);

    /*this.cardRoot.querySelector('.grid_consumption').style['height'] = '10px';
    this.cardRoot.querySelector('.grid_consumption').style['width'] = 44 * pxRate + 'px';
    this.cardRoot.querySelector('.grid_consumption').style['margin-left'] = 22 * pxRate + 'px';
    this.cardRoot.querySelector('.grid_consumption').style['margin-top'] = 11 * pxRate + 'px';
    this.cardRoot.querySelector('.grid_consumption svg').setAttribute('height', '10');
    this.cardRoot.querySelector('.grid_consumption svg').setAttribute('width', 44 * pxRate);
    this.cardRoot.querySelector('.grid_consumption svg').setAttribute("viewBox", "0 0 "+ 44 * pxRate + " 10"); 
    this.grid_consumption_line = this.cardRoot.querySelector('#grid_consumption_line');
    this.grid_consumption_line.setAttribute('d','M5,5 C5,5 '+ lineSize * 2 +',5 '+ lineSize*2 +',5');*/

    this.correctDimensionsOfCircleLineAndContainer('battery_consumption', 2 * pxRate, 44 * pxRate, 22 * pxRate, 11 * pxRate, 'M5,5 C5,5 '+ lineSize * 2 +',5 '+ lineSize*2 +',5');

    /*this.cardRoot.querySelector('.battery_charge').style['height'] = '10px';
    this.cardRoot.querySelector('.battery_charge').style['width'] = 44 * pxRate + 'px';
    this.cardRoot.querySelector('.battery_charge').style['margin-left'] = 22 * pxRate + 'px';
    this.cardRoot.querySelector('.battery_charge').style['margin-top'] = 11 * pxRate + 'px';
    this.cardRoot.querySelector('.battery_charge svg').setAttribute('height', '10');
    this.cardRoot.querySelector('.battery_charge svg').setAttribute('width', 44 * pxRate);
    this.cardRoot.querySelector('.battery_charge svg').setAttribute("viewBox", "0 0 "+ 44 * pxRate + " 10"); 
    this.cardRoot.querySelector('#batteryChargeLine').setAttribute('d','M5,5 C5,5 5,'+ lineSize * 2 +' 5,'+ lineSize*2);*/
    this.correctDimensionsOfCircleLineAndContainer('battery_charging', 2 * pxRate, 44 * pxRate, 22 * pxRate, 11 * pxRate, 'M5,5 C5,5 5,'+ lineSize * 2 +' 5,'+ lineSize*2);

    //console.log('chekcing clientHeight ' + this.clientHeight);
    //icons.style.iconSize = 10*pxRate;
    
    //console.log("testing query selector: " + document.readyState);
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

    if(this.counter < 1000){
      var obj = this;
      this.counter++;
      requestAnimationFrame(function(timestamp){
        obj.updateAllCircles(timestamp);
      });
    }
  }

  updateOneCircle(timestamp, entity) {
    //console.log('updatingOneCircle speed:' + entity.speed + " maxpos:" + entity.maxPosition);
    //console.log('updatingOneCircle beg pos:' + entity.currentPosition);
    //console.log('client Width:' + this.clientWidth);
    if (this.clientWidth !== 0) {
      //entity.maxPosition = 2 * this.clientWidth - 570;
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
    //console.log(entity.circle);
    if(entity.line == undefined) return;

    let LineLength = entity.line.getTotalLength();
    let percentagePosition = entity.currentPosition / entity.maxPosition;
    let point = entity.line.getPointAtLength(LineLength * percentagePosition);
    //console.log('percentage position:' +  percentagePosition );
    entity.circle.setAttributeNS(null, "cx", point.x);
    entity.circle.setAttributeNS(null, "cy", point.y);

    //console.log('updatingOneCircle end pos:' + entity.currentPosition + " poin.x: " + point.x + " solarLineLength:" + solarLineLength + " startpos:" + entity.startPosition);
    //entity.moveCircle(entity.currentPosition, entity);

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

    // I have found min & max speed that looks ok to me.
    // And then I have calculated math function
    // using the dots:
    //
    // value    speed
    // 0.001    0.02
    // 15       2

    if (value > 0) {
      //speed = 0.1320 * value + 0.02;
      speed = 0.01320 * value + 0.02;
    }

    return speed;
  }

}