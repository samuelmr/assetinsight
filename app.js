/*jshint node:true*/

// app.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express');
var request = require('request');

// Watson
var https = require('https');
var url = require('url');
var querystring = require('querystring');
var extend = require('util')._extend;
var flatten = require('./flatten');


// setup middleware
var app = express();
app.use(app.router);
app.use(express.errorHandler());
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(express.static(__dirname + '/public')); //setup static public directory
app.set('view engine', 'jade');
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views


// Watson
// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
// If VCAP_SERVICES is undefined we use a local module as mockup

// defaults for dev outside bluemix
var service_url = 'http://127.0.0.1:3000/';
var service_username = 'foo';
var service_password = 'bar';

if (process.env.VCAP_SERVICES) {
  console.log('Parsing VCAP_SERVICES');
  var services = JSON.parse(process.env.VCAP_SERVICES);
  //service name, check the VCAP_SERVICES in bluemix to get the name of the services you have
  var service_name = 'user_modeling';
  
  if (services[service_name]) {
    var svc = services[service_name][0].credentials;
    service_url = svc.url;
    service_username = svc.username;
    service_password = svc.password;
  } else {
    console.log('The service '+service_name+' is not in the VCAP_SERVICES, did you forget to bind it?');
  }

} else {
  console.log('No VCAP_SERVICES found in ENV, using defaults for local development');
}

console.log('service_url = ' + service_url);
console.log('service_username = ' + service_username);
console.log('service_password = ' + new Array(service_password.length).join("X"));

var auth = 'Basic ' + new Buffer(service_username + ':' + service_password).toString('base64');



// render index page
app.get('/', function(req, res){
  res.render('index');
});

app.get('/user/:name', function(req, res){
  var username = req.params.name;
  res.render('user', {"username": username});
});

app.get('/quiz/:name?', function(req, res){
  var username = req.params.name || "";
  res.render('quiz', {"username": username});
});

app.all('/personalize/:name?', function(req, res){
  var username = req.params.name || "";
  var post_options = {"method": };
  var post_data = req.param("q1") + " " + req.param("q2") + " " + req.param("q3");
  console.log(post_data);


/*
  var post_req = method.request(post_options, function(res) {
    console.log('STATUS:', res.statusCode, 'HEADERS:', JSON.stringify(res.headers));
    res.setEncoding('utf8');
    var respdata = "";
    res.on('data', function (chunk) { respdata += chunk; });
    res.on('error', function(e) { console.log("Got error: " + e.message); });
    res.on('end', function() {
      console.log("Request end");
      var data = JSON.parse(respdata);
      var list = flatten(data.tree);
      resp.render('demo.html', { text: text, msg: "Content analyzed!", traits: list });
    });
  });
  // Post the data
  post_req.write(post_data);
  post_req.end();
  console.log("Request posted");  
  res.render('personalized', {"username": username});
*/
  // See User Modeling API docs. Path to profile analysis is /api/v2/profile
  // remove the last / from service_url if exist
  var parts = url.parse(service_url.replace(/\/$/,''));
  
  var profile_options = { host: parts.hostname,
    port: parts.port,
    path: parts.pathname + "/api/v2/profile",
    method: 'POST',
    headers: {
      'Content-Type'  :'application/json',
      'Authorization' :  auth }
    };
    
  // create a profile request with the text and the htpps options and call it
  create_profile_request(profile_options,post_data)(function(error,profile_string) {
    if (error)  {
      console.log("Watson didn't reply");
    }
    else {
      // parse the profile and format it
      var profile_json = JSON.parse(profile_string);
      var flat_traits = flatten.flat(profile_json.tree);

      // Extend the profile options and change the request path to get the visualization
      // Path to visualization is /api/v2/visualize, add w and h to get 900x900 chart
      var viz_options = extend(profile_options, { path :  parts.pathname + "/api/v2/visualize?w=900&h=900&imgurl=%2Fimages%2Fapp.png"})

      // create a visualization request with the profile data
      create_viz_request(viz_options,profile_string)(function(error,viz) {
        if (error)  {
          console.log("No visualization this time...");
        }
        else {
          return res.render('personalized', {'content': req.body.content, 'traits': flat_traits, 'viz':viz});
        };
      });
    }
});

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

