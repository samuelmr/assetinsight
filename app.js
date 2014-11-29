/*jshint node:true*/

// app.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express');
var request = require('request');

// setup middleware
var app = express();
app.use(app.router);
app.use(express.errorHandler());
app.use(express.static(__dirname + '/public')); //setup static public directory
app.set('view engine', 'jade');
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views

// render index page
app.get('/', function(req, res){
  res.render('index');
});

// render index page
app.get('/userdata/:id', function(req, res){
  var id = req.params.id;
  var width = "800";
  var height = "500";
  var max = "9";
  var cats = [
                  "Real estate",
                  "Deposit account",
                  "Savings account",
                  "Fund",
                  "Shares",
                  "Pension fund",
               ];
  var values = [];
  var url = 'http://208.43.108.6:1222/ibmlgeef/sb/pk/customer/' + id;
  // var url = 'http://208.43.108.6:1222/ibmlgeef/sb/etw/customer/' + id;
  request(url, function(err, resp, body) {
    var json = JSON.parse(body);
    var successful = 0;
    for (var i=0; i<json.length; i++) {
      var prod = json[i];
      // var amount = prod.volumeSecurity;
      var amount = Math.round(prod.volumeSavings/10)/100;
      if (!amount || (amount < 1)) {
        continue;
      }
      var volatility = 0;
      var liquidity = 0;
      var category = Math.ceil((cats.length - 1) * Math.random());
      switch (category) {
        case 0: 
          volatility = 3 * Math.random();
          liquidity = (5 * Math.random()) + 5;
          break;
        case 1: 
          volatility = 0.5 + Math.random();
          liquidity = 0.5 + Math.random();
          break;
        case 2: 
          volatility = 2.5 + Math.random();
          liquidity = 3 + Math.random();
          break;
        case 3: 
          volatility = (6 * Math.random()) + 4;
          liquidity = (8 * Math.random()) + 2;
          break;
        case 4: 
          volatility = (3 * Math.random()) + 7;
          liquidity = (8 * Math.random()) + 2;
          break;
        case 5:
          volatility = (5 * Math.random()) + 5;
          liquidity = (2 * Math.random()) + 8;
          break;
        default:
          volatility = 10 * Math.random();
          liquidity = 10 * Math.random();
      }
      // var name = 0;
      // values.push([amount, volatility, liquidity, category, name]);
      values.push([amount, volatility, liquidity, category]);
      if (++successful >= max) {
        break;
      }
    }
    var data = {
   "copyright": "Gonabai.com",
   "data": [
      {
         "fields": [
            {
               "format": {
                  "suffix": " k\u20AC"
               },
               "id": "amount"
            },
            {
               "id": "volatility"
            },
            {
               "id": "liquidity",
               // "max": 50,
               // "min": 0
            },
            {
               "categories": cats,
               "id": "category",
            },
/*
            {
               "id": "name",
            },
*/
         ],
         "id": "data",
         "rows": values
      }
   ],
   "grammar": [
      {
         "coordinates": {
            "dimensions": [
               {
                  "scale": {
                     "spans": [{"min": 0, "max": 10}],
                  },
                  "axis": {
                     "lineStyle": {
                        "fill": {
                           "a": 0.0,
                           "h": 0,
                           "l": 0,
                           "s": 0
                        }
                     },
                     "markStyle": {
                        "fill": {
                           "a": 0,
                           "h": 0,
                           "l": 0,
                           "s": 0
                        }
                     },
                     "tickStyle": {
                        "fill": {
                           "a": 0.6,
                           "h": 0,
                           "l": 0,
                           "s": 0
                        },
                        "font": {
                           "family": "Arial",
                           "size": "10.5pt"
                        },
                        "padding": 5
                     }
                  }
               },
               {
                  "scale": {
                     "spans": [{"min": 0, "max": 10}],
                  },
                  "axis": {
                     "lineStyle": {
                        "fill": {
                           "a": 0.25,
                           "h": 0,
                           "l": 0,
                           "s": 0
                        }
                     },
                     "markStyle": {
                        "fill": {
                           "a": 0,
                           "h": 0,
                           "l": 0,
                           "s": 0
                        }
                     },
                     "tickStyle": {
                        "fill": {
                           "a": 0.6,
                           "h": 0,
                           "l": 0,
                           "s": 0
                        },
                        "font": {
                           "family": "Arial",
                           "size": "10.5pt"
                        },
                        "padding": 3
                     }
                  }
               }
            ],
            "style": {
               "fill": "white",
               "outline": "black",
               "stroke": {
                  "width": 0.25
               }
            }
         },
         "elements": [
            {
               "label": [
                  {
                     "content": [
                        "High Risk, High Reward"
                     ],
                     "style": {
                        "align": "end",
                        "fill": "white",
                        "font": {
                           "family": "Arial",
                           "size": "24"
                        },
                        "location": "inside",
                        "padding": 10,
                        "valign": "start"
                     }
                  }
               ],
               "position": [
                  {
                     "value": "50%"
                  },
                  {
                     "value": "100%"
                  },
                  {
                     "value": "50%"
                  },
                  {
                     "value": "100%"
                  }
               ],
               "style": {
                  "fill": {
                     "a": 0.2,
                     "h": 0.7,
                     "s": 0.55,
                     "v": 0.87
                  }
               },
               "type": "interval"
            },
            {
               "label": [
                  {
                     "content": [
                        "Low profit, usable immediately"
                     ],
                     "style": {
                        "align": "end",
                        "fill": "white",
                        "font": {
                           "family": "Arial",
                           "size": "24"
                        },
                        "location": "inside",
                        "padding": 10,
                        "valign": "start"
                     }
                  }
               ],
               "position": [
                  {
                     "value": "0%"
                  },
                  {
                     "value": "50%"
                  },
                  {
                     "value": "0%"
                  },
                  {
                     "value": "50%"
                  }
               ],
               "style": {
                  "fill": {
                     "a": 0.2,
                     "h": 0.7,
                     "s": 0.55,
                     "v": 0.87
                  }
               },
               "type": "interval"
            },
            {
               "position": [
                  {
                     "value": 0
                  },
                  {
                     "value": 0
                  },
                  {
                     "value": -100
                  },
                  {
                     "value": 100
                  }
               ],
               "style": {
                  "fill": {
                     "a": 0.8
                  },
                  "stroke": {
                     "style": "Dash",
                     "width": 0.5
                  }
               },
               "type": "edge"
            },
            {
               "position": [
                  {
                     "value": -100
                  },
                  {
                     "value": 100
                  },
                  {
                     "value": 0
                  },
                  {
                     "value": 0
                  }
               ],
               "style": {
                  "fill": {
                     "a": 0.8
                  },
                  "stroke": {
                     "style": "Dash",
                     "width": 0.5
                  }
               },
               "type": "edge"
            },
            {
               "color": [
                  {
                     "field": {
                        "$ref": "category"
                     },
                     // "id": "colorId",
                     "modifies": "both",
                     "palette": [
                       {
                         "h": 0.2194,
                         "s": 0.65,
                         "v": 0.75
                       },
                       {
                         "h": 0.4194,
                         "s": 0.65,
                         "v": 0.75
                       },
                       {
                         "h": 0,
                         "s": 0.65,
                         "v": 0.85
                       },
                       {
                         "h": 0.683,
                         "s": 0.55,
                         "v": 0.85
                       },
                       {
                         "h": 0.5805,
                         "s": 0.7,
                         "v": 0.85
                       }
                     ]
                  }
               ],
               "label": [
                  {
                     "content": [
                        {
                           "$ref": "category"
                        },
/*
                        "\n",
                        {
                           "$ref": "volatility"
                        },
                        '/',
                        {
                           "$ref": "liquidity"
                        },
*/
                        "\n",
                        {
                           "$ref": "amount"
                        }
                     ],
                     "style": {
                        "fill": {
                           "a": 0.75
                        },
                        "location": "outside"
                     }
                  }
               ],
               "position": [
                  {
                     "field": {
                        "$ref": "volatility"
                     }
                  },
                  {
                     "field": {
                        "$ref": "liquidity"
                     }
                  }
               ],
               "size": [
                  {
                     "field": {
                        "$ref": "amount"
                     },
                     // "id": "sizeId",
                     "mapping": [
                        {
                           "at": "0%",
                           "size": "0%"
                        },
                        {
                           "at": "10%",
                           "size": "90%"
                        }
                     ]
                  }
               ],
               "style": {
                  "fill": {
                     "colors": [
                        {
                           "color": {
                              "l": 1
                           },
                           "offset": 0.0
                        },
                        {
                           "offset": 1.0
                        }
                     ],
                     "focus": {
                        "x": "30%",
                        "y": "30%"
                     },
                     "type": "radial"
                  },
                  "outline": {
                     "dValue": -0.25
                  },
                  "size": "22%%",
                  "stroke": {
                     "width": 0.5
                  }
               },
               "type": "point"
            }
         ],
         "labelCollisionMethod": "none",
         "style": {
            "fill": {
               "h": 0,
               "l": 1,
               "s": 0
            },
            "padding": {
               "bottom": "2%",
               "left": "2%",
               "right": "2%",
               "top": "5%"
            }
         }
      }
   ],
   "size": {
      "height": height,
      "width": width
   },
   "style": {
      "fill": {
         "h": 0,
         "l": 1,
         "s": 0
      }
   },
   "version": "7.0"};
	res.json(data);
  });
});

// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
// TODO: Get service credentials and communicate with bluemix services.

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);
// Start server
app.listen(port, host);
console.log('App started on port ' + port);

