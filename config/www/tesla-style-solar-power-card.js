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
    this.pixelMultiplier = 3;
    var pixelMultiplier = this.pixelMultiplier;

    class sensorCardData {
      constructor(){
        this.speed = 0;
        this.startPosition= -10;
        this.currentPosition = -10;
        this.maxPosition = pixelMultiplier * 10;
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
      //solarYield: new sensorCardData(),
      gridFeed: new sensorCardData(),
      //batteryCharge: new sensorCardData(),
    }

    this.solarCardElements.houseConsumption.entity = config.house_consumption_entity;
    this.solarCardElements.houseConsumption.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cx", entity.currentPosition);
    }
    /*this.solarCardElements.solarYield.entity = config.solar_yield_entity;
    this.solarCardElements.solarYield.circleColor = "#326342";
    this.solarCardElements.solarYield.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cy", entity.currentPosition);
    }*/
    this.solarCardElements.gridConsumption.entity = config.grid_consumption_entity;
    this.solarCardElements.gridConsumption.circleColor = "#326342";
    this.solarCardElements.gridConsumption.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cx", entity.currentPosition);
    }
    this.solarCardElements.gridFeed.entity = config.grid_feed_in_entity;
    this.solarCardElements.gridFeed.circleColor = "#326342";
    this.solarCardElements.gridFeed.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cx", entity.currentPosition);
    }
    this.solarCardElements.batteryConsumption.entity = config.battery_consumption_entity;
    this.solarCardElements.batteryConsumption.circleColor = "#326342";
    this.solarCardElements.batteryConsumption.moveCircle = function(nextPosition, entity){
      entity.circle.setAttributeNS(null, "cy", entity.currentPosition);
    }
    this.solarCardElements.solarConsumption.entity = config.solar_consumption_entity;
    this.solarCardElements.solarConsumption.circleColor = "#326342";
    this.solarCardElements.solarConsumption.moveCircle = function(nextPosition, entity){
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
      houseConsumptionLine = '';//`<line x1="0" y1="20" x2="500" y2="20" style="stroke:var(--primary-text-color);" />`;
    }
    //var solarConsumptionLine = '<path id=SolarConsumptionLine d="M5,5 C5,109 5,105 105,105" />';//`<line x1="0" y1="0" x2="0" y2="200" style="stroke:var(--primary-text-color);" />`;
    //var batteryLine = '<path id="batteryLine" d="M5,110 C5,5 5,5 110,5" />';//`<line x1="0" y1="0" x2="0" y2="200" style="stroke:var(--primary-text-color);" />`;


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

.battery{
}
#batteryLine, #SolarConsumptionLine, #gridFeedInLine{
  stroke:black;
  fill:none;
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
        viewBox="0 0 40 `+ this.pixelMultiplier * 10 + `"
        preserveAspectRatio="xMinYMax slice"
      >
      </svg>
    </div>
  <div class="acc_line grid_feed_in">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20px"
      height="100%"
      viewBox="0 0 40 `+ this.pixelMultiplier * 10 + `"
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
        viewBox="0 0 `+ this.pixelMultiplier * 10 + ` 40"
        preserveAspectRatio="xMinYMax slice"
      >
      </svg>
    </div>
    <div class="acc_line house_consumption">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50%"
        height="20px"
        viewBox="0 0 `+ this.pixelMultiplier * 10 + ` 40"
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
        viewBox="0 0 40 `+ this.pixelMultiplier * 10 + `"
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

    this.solarCardElements.solarConsumption.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    this.solarCardElements.solarConsumption.line = this.solarLine;
    var circle = this.solarCardElements.solarConsumption.circle;
    circle.setAttributeNS(null, "r", "5");
    circle.setAttributeNS(null, "cx", "5");
    circle.setAttributeNS(null, "cy", this.solarCardElements.solarConsumption.startPosition);
    circle.setAttributeNS(null, "fill", this.solarCardElements.solarConsumption.circleColor);
    this.querySelectorAll(".solar_consumption svg").item(0).appendChild(circle);
    this.solarCardElements.solarConsumption.line = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    this.solarCardElements.solarConsumption.line.setAttributeNS(null, "d", "M5,5 C5,109 5,105 105,105");
    this.solarCardElements.solarConsumption.line.setAttributeNS(null, 'id', "SolarConsumptionLine");
    this.querySelector(".solar_consumption svg").appendChild(this.solarCardElements.solarConsumption.line);
    
    this.solarCardElements.houseConsumption.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = this.solarCardElements.houseConsumption.circle;
    circle.setAttributeNS(null, "r", "5");
    circle.setAttributeNS(null, "cx", this.solarCardElements.houseConsumption.startPosition);
    circle.setAttributeNS(null, "cy", "5");
    circle.setAttributeNS(null, "fill", this.solarCardElements.houseConsumption.circleColor);
    this.querySelectorAll(".house_consumption svg").item(0).appendChild(circle);

    this.solarCardElements.gridConsumption.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = this.solarCardElements.gridConsumption.circle;
    circle.setAttributeNS(null, "r", "5");
    circle.setAttributeNS(null, "cx", this.solarCardElements.gridConsumption.startPosition);
    circle.setAttributeNS(null, "cy", "5");
    circle.setAttributeNS(null, "fill", this.solarCardElements.gridConsumption.circleColor);
    this.querySelectorAll(".grid_consumption svg").item(0).appendChild(circle);
    this.solarCardElements.gridConsumption.line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
    this.solarCardElements.gridConsumption.line.setAttributeNS(null, "x1", "5");
    this.solarCardElements.gridConsumption.line.setAttributeNS(null, "dy1", "5");
    this.solarCardElements.gridConsumption.line.setAttributeNS(null, "x2", "100");
    this.solarCardElements.gridConsumption.line.setAttributeNS(null, 'y2', "5");
    this.solarCardElements.gridConsumption.line.setAttributeNS(null, 'id', "gridConsumptionLine");
    this.querySelector(".grid_consumption svg").appendChild(this.solarCardElements.gridConsumption.line);

    this.solarCardElements.gridFeed.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = this.solarCardElements.gridFeed.circle;
    circle.setAttributeNS(null, "r", "5");
    circle.setAttributeNS(null, "cx", this.solarCardElements.gridFeed.startPosition);
    circle.setAttributeNS(null, "cy", "5");
    circle.setAttributeNS(null, "fill", this.solarCardElements.gridFeed.circleColor);
    this.querySelector(".grid_feed_in svg").appendChild(circle);
    this.solarCardElements.gridFeed.line = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    this.solarCardElements.gridFeed.line.setAttributeNS(null, "d", "M101,9 C100,101 99,106 10,102");
    this.solarCardElements.gridFeed.line.setAttributeNS(null, 'id', "gridFeedInLine");
    this.querySelector(".grid_feed_in svg").appendChild(this.solarCardElements.gridFeed.line);

    this.solarCardElements.batteryConsumption.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    var circle = this.solarCardElements.batteryConsumption.circle;
    circle.setAttributeNS(null, "r", "5");
    circle.setAttributeNS(null, "cx", "5");
    circle.setAttributeNS(null, "cy", this.solarCardElements.batteryConsumption.startPosition);
    circle.setAttributeNS(null, "fill", this.solarCardElements.batteryConsumption.circleColor);
    this.solarCardElements.batteryConsumption.line = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    this.solarCardElements.batteryConsumption.line.setAttributeNS(null, "d", "M1000,10 C10,109 10,105 105,105");
    this.solarCardElements.batteryConsumption.line.setAttributeNS(null, 'id', "batteryLine");
    this.querySelector(".battery svg").appendChild(this.solarCardElements.batteryConsumption.line);

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


  changeStylesDependingOnWidth(newWidth){
    this.oldWidth = newWidth;
    this.pixelMultiplier = newWidth / 100;
    var pixelMultiplier = this.pixelMultiplier;

    //console.log('width: ' + newWidth + ' multiplier:' + this.pixelMultiplier);
    this.cardRoot = document.querySelector('home-assistant').shadowRoot.querySelector('home-assistant-main').shadowRoot.querySelector('ha-panel-lovelace').shadowRoot.querySelector('hui-root').shadowRoot.querySelector('hui-view').shadowRoot.querySelector('tesla-style-solar-power-card ha-card');


    this.cardRoot.querySelector('.tesla-style-solar-power-card').style['width'] = 90 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.tesla-style-solar-power-card').style['height'] = 90 * pixelMultiplier + 'px';


    var iconContainer = this.cardRoot.querySelectorAll('.acc_container');
    iconContainer.forEach(
      function(currentValue, currentIndex, iconObj){
        iconObj[currentIndex].style["height"] = 10 * pixelMultiplier + 'px';
        iconObj[currentIndex].style["width"] = 10 * pixelMultiplier + 'px';
        iconObj[currentIndex].style["padding"] = 7 * pixelMultiplier + 'px';        
      }
    );

    var icons = this.cardRoot.querySelectorAll('ha-icon');
    icons.forEach(
      function(currentValue, currentIndex, listObj){
        console.log(listObj[currentIndex]);
        listObj[currentIndex].shadowRoot.querySelector('ha-svg-icon').style["height"] = 10 * pixelMultiplier + 'px';       
        listObj[currentIndex].shadowRoot.querySelector('ha-svg-icon').style["width"] = 10 * pixelMultiplier + 'px';       
      }
    );

    this.cardRoot.querySelector('.acc_top').style['padding-bottom'] = 9 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.acc_bottom').style['padding-top'] = 9 * pixelMultiplier + 'px';

    let lineSize = 22 * pixelMultiplier;

    this.cardRoot.querySelector('.house_consumption').style['height'] = '10px';
    this.cardRoot.querySelector('.house_consumption').style['width'] = 22 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.house_consumption').style['margin-left'] = 47 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.house_consumption').style['margin-top'] = 11 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.house_consumption svg').setAttribute('height', '10');
    this.cardRoot.querySelector('.house_consumption svg').setAttribute('width', 22 * pixelMultiplier);
    this.cardRoot.querySelector('.house_consumption svg').setAttribute("viewBox", "0 0 "+ 22 * pixelMultiplier + " 10"); 
    this.solarCardElements.houseConsumption.maxPosition = 22 * pixelMultiplier;

    this.cardRoot.querySelector('.battery').style['width'] = 23 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.battery').style['height'] = 23 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.battery').style['margin-left'] = 44 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.battery').style['margin-top'] = 12 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.battery svg').setAttribute('width', 22 * pixelMultiplier);
    this.cardRoot.querySelector('.battery svg').setAttribute('height', 23 * pixelMultiplier);
    this.cardRoot.querySelector('.battery svg').setAttribute("viewBox", "0 " + pixelMultiplier+ ' ' + 22 * pixelMultiplier + ' ' + 23 * pixelMultiplier); 
    this.cardRoot.querySelector('#batteryLine').setAttribute('d','M5,'+ lineSize +' C10,10 10,10 '+lineSize+',10');
    this.solarCardElements.batteryConsumption.maxPosition = 20 * pixelMultiplier;


    this.cardRoot.querySelector('.solar_consumption').style['width'] = 23 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.solar_consumption').style['height'] = 23 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.solar_consumption').style['margin-left'] = 44 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.solar_consumption').style['margin-top'] = -9  * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.solar_consumption svg').setAttribute('width', 22 * pixelMultiplier);
    this.cardRoot.querySelector('.solar_consumption svg').setAttribute('height', 23 * pixelMultiplier);
    this.cardRoot.querySelector('.solar_consumption svg').setAttribute("viewBox", "0 " + pixelMultiplier + ' ' + 22 * pixelMultiplier + ' ' + 23 * pixelMultiplier); 
    this.solarLine = this.cardRoot.querySelector('#SolarConsumptionLine');
    this.solarLine.setAttribute('d','M5,5 C5,'+ lineSize +' 5,'+ lineSize +' '+lineSize+','+lineSize);
    this.solarCardElements.batteryConsumption.maxPosition = 20 * pixelMultiplier;

    this.cardRoot.querySelector('.grid_feed_in').style['width'] = 23 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.grid_feed_in').style['height'] = 23 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.grid_feed_in').style['margin-left'] = 24 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.grid_feed_in').style['margin-top'] = 11  * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.grid_feed_in svg').setAttribute('width', 22 * pixelMultiplier);
    this.cardRoot.querySelector('.grid_feed_in svg').setAttribute('height', 23 * pixelMultiplier);
    this.cardRoot.querySelector('.grid_feed_in svg').setAttribute("viewBox", "0 " + pixelMultiplier + ' ' + 22 * pixelMultiplier + ' ' + 23 * pixelMultiplier); 
    this.gridFeedInLine = this.cardRoot.querySelector('#gridFeedInLine');
    this.gridFeedInLine.setAttribute('d','M'+ lineSize +',5 C'+ lineSize +','+ lineSize +' '+ lineSize +','+ lineSize +' 5,'+ lineSize);

    this.cardRoot.querySelector('.grid_consumption').style['height'] = '10px';
    this.cardRoot.querySelector('.grid_consumption').style['width'] = 44 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.grid_consumption').style['margin-left'] = 10 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.grid_consumption').style['margin-top'] = 22 * pixelMultiplier + 'px';
    this.cardRoot.querySelector('.grid_consumption svg').setAttribute('height', '10');
    this.cardRoot.querySelector('.grid_consumption svg').setAttribute('width', 22 * pixelMultiplier);
    this.cardRoot.querySelector('.grid_consumption svg').setAttribute("viewBox", "0 0 "+ 44 * pixelMultiplier + " 10"); 
    this.gridFeedInLine = this.cardRoot.querySelector('#gridConsumptionLine');
    this.gridFeedInLine.setAttribute('x2',lineSize * 2 + 'px');
    this.solarCardElements.houseConsumption.maxPosition = 22 * pixelMultiplier;

    //console.log('chekcing clientHeight ' + this.clientHeight);
    //icons.style.iconSize = 10*pixelMultiplier;
    
    //console.log("testing query selector: " + document.readyState);
  }


  updateAllCircles(timestamp){
    //console.log(' in updateAllCircles clientWidth:' + this.clientWidth);
    //console.log("timestamp alone: " + timestamp);
    for (var prop in this.solarCardElements) {
      if (Object.prototype.hasOwnProperty.call(this.solarCardElements, prop)) {
        console.log("calling this.updateAllCircles "+ prop);
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
    console.log('percentage position:' +  percentagePosition );
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

customElements.define('tesla-style-solar-power-card', TeslaStyleSolarPowerCard);
document.addEventListener("DOMContentLoaded", function(event) {
  console.log("now we are lloadad");
});