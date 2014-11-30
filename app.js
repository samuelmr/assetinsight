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
app.use(express.errorHandler());
app.use(express.urlencoded());
app.use(app.router);
app.use(express.static(__dirname + '/public')); //setup static public directory
app.set('view engine', 'jade');
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views

// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
// If VCAP_SERVICES is undefined we use a local module as mockup

// defaults for dev outside bluemix
var service_url = "https://gateway.watsonplatform.net/systemu/service/";
var service_username = "72a773d7-1211-4b11-ba6b-bdae4a66a18b";
var service_password = "pL83Rbw89Fhf";

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
console.log('service_password = ' + new Array(service_password.length+1).join("X"));

var auth = 'Basic ' + new Buffer(service_username + ':' + service_password).toString('base64');

// render index page
app.get('/', function(req, res){
  res.render('index');
});

// render index page
app.get('/consent/:name?', function(req, res){
  var username = req.params.name || "";
  res.render('consent', {"username": username});
});

app.get('/user/:name', function(req, res){
  var username = req.params.name;
  res.render('user', {"username": username});
});

app.get('/quiz/:name?', function(req, res){
  var username = req.params.name || "";
  var what, when, q1, q2, q3, hidden;
  what = when = q1 = q2 = q3 = "";
  // just something copypasted from somewhere on the net (http://www.amosweb.com/cgi-bin/awb_nav.pl?s=wpd&c=dsp&k=bank+assets)
  hidden = "Before getting into the details of bank assets, consider this representative, hypothetical balance sheet for OmniBank (a representative, hypothetical bank) presented in the exhibit to the right. Like any balance sheet this one for the OmniBank is divided into two sides--assets on the left and liabilities and net worth on the right. As a balance sheet, both sides are equal--they balance. The assets on the left-hand side of the balance sheet are what OmniBank owns. Liabilities on the right-hand side of the balance sheet are what OmniBank owes. Net worth, also on the right-hand side of the balance sheet, is then the difference between assets and liabilities. In effect, net worth is what the bank owes to the owners of OmniBank. As a profit-seeking business, OmniBank's primary duty is to adjust these assets and liabilities to acquire profit. Of course, ALL businesses acquire profit by adjusting assets and liabilities. They boost revenue assets and reduce cost liabilities. But, unlike other types of producers, banks do not make adjustments with real production. In fact, the accounting process of adjusting entries in the balance sheet IS OmniBank's production. OmniBank's business is to change these entries.";
  switch (username) {
    case "harry":
      what = "I want to make sure I'll not be poor when I retire 10 years from now."
      when = "I want to start now and save until retirement."
      q1 = "";
      q2 = "";
      q3 = "";
      hidden = "";
      break;
    case "joe":
      what = "I want to save for security - in case everything doesn't work out as planned."
      when = "I want to start now and keep saving until I get rich enough to stop."
      q1 = "";
      q2 = "";
      q3 = "";
      hidden = "I bought an apartment for millions. I rebuilt it. Feng Shui! I bought art. I played a lot of poker. I began investing in companies. A million here. A few hundred thousand there. One IPO, I put $2 million in at $20 and watched it go to $0. They made wireless devices for deaf people. Huge market. I started another company. CMGI, Allen & Co, Investcorp, Henry Kravis, and a billion others invested. I started a VC fund. I invested in more companies. Then Internet stocks started to go down. This is ridiculous, I thought. The Internet is here to stay. I knew nothing about stocks or valuations or anything resembling rational thought. I doubled down. Then quadrupled down. Then 8-upled down. I felt like I was going to die. That zero equals death. I couldn’t believe how stupid I had been. I had lost all my friends. Nobody returned calls. I would go to the ATM machine and feel my blood going through my whole body when I saw how much was left. I was going to zero and nothing could stop it. There were no jobs,  there was nothing."
      break;
    case "lisa":
      what = "I want to travel around the world in one year."
      when = "I want to leave before I turn 30, so 2021 at the latest."
      q1 = "We're going to become debt free, first and foremost. We're going to keep the same cars we're driving and pay off the mortgage. We have some home improvements in mind. But right now, I'm going to have lunch with my husband. We will also help children with student loans, and donate to charities.";
      q2 = "";
      q3 = "";
      hidden = "";
      break;
    case "tina":
      what = "I want to travel around the world in one year."
      when = "I want to leave before I turn 30, so 2021 at the latest."
      q1 = "";
      q2 = "";
      q3 = "";
      hidden = "";
      break;
  }  
  res.render('quiz', {"username": username, "what": what, "when": when, "q1": q1, "q2": q2, "q3": q3, "hidden": hidden});
});

app.all('/personalize/:name?', function(req, res){
  var username = req.params.name || "";
  // console.log("params: " + req.params);
  // console.log("body: " + req.body);
  // console.log("what: " + req.param("what"));
  var post_data = req.param("what") + " " + req.param("when") + " " + 
                  req.param("q1") + " " + req.param("q2") + " " + req.param("q3")+ 
                  req.param("hidden");
  // console.log(post_data);


/*
  var post_options = {"method": "POST"};
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

  var parts = url.parse(service_url.replace(/\/$/,''));
  
  var profile_options = { host: parts.hostname,
    port: parts.port,
    path: parts.pathname + "/api/v2/profile",
    method: 'POST',
    headers: {
      'Content-Type'  :'application/json',
      'Authorization' :  auth 
    }
  };

  // create a profile request with the text and the htpps options and call it
  create_profile_request(profile_options,post_data)(function(error,profile_string) {
    if (error)  {
      console.log("Watson didn't reply. " + error.message);
      return res.render('personalized', {"username": username});
    }
    else {
      var profile_json = JSON.parse(profile_string);
      var flat_traits = flatten.flat(profile_json.tree);

      // Extend the profile options and change the request path to get the visualization
      // Path to visualization is /api/v2/visualize, add w and h to get 900x900 chart
      var viz_options = extend(profile_options, { path :  parts.pathname + "/api/v2/visualize?w=900&h=900&imgurl=%2Fimages%2Fapp.png"});

      // create a visualization request with the profile data
      create_viz_request(viz_options,profile_string)(function(error,viz) {
        if (error)  {
          console.log("No visualization this time..." + error.message);
          return res.render('personalized', {"username": username});
        }
        else {
          return res.render('personalized', {"username": username, 'content': req.body.content, 'traits': flat_traits, 'viz':viz});
        };
      });
    }
  });
});

app.get('/suggestions/:name?', function(req, res){
  var username = req.params.name || "";
  res.render('suggestions', {"username": username});
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

// creates a request function using the https options and the text in content
// the function that return receives a callback
var create_profile_request = function(options,content) {
  return function (/*function*/ callback) {
    // create the post data to send to the User Modeling service
    var post_data = {
      'contentItems' : [{ 
        'userid' : 'dummy',
        'id' : 'dummyUuid',
        'sourceid' : 'freetext',
        'contenttype' : 'text/plain',
        'language' : 'en',
        'content': content
      }]
    };
    // Create a request to POST to the User Modeling service
    var profile_req = https.request(options, function(result) {
      result.setEncoding('utf-8');
      var response_string = '';

      result.on('data', function(chunk) {
        response_string += chunk;
      });
      
      result.on('end', function() {

        if (result.statusCode != 200) {
          var error = JSON.parse(response_string);
          callback({'message': error.user_message}, null);
        } else
          callback(null,response_string);
      });
    });
  
    profile_req.on('error', function(e) {
      callback(e,null);
    });

    profile_req.write(JSON.stringify(post_data));
    profile_req.end();
  }
};

// creates a request function using the https options and the profile 
// the function that return receives a callback
var create_viz_request = function(options,profile) {
  return function (/*function*/ callback) {
    // Create a request to POST to the User Modeling service
    var viz_req = https.request(options, function(result) {
      result.setEncoding('utf-8');
      var response_string = '';

      result.on('data', function(chunk) {
        response_string += chunk;
      });
      
      result.on('end', function() {
        if (result.statusCode != 200) {
          var error = JSON.parse(response_string);
          callback({'message': error.user_message}, null);
        } else
          callback(null,response_string);      });
    });
  
    viz_req.on('error', function(e) {
      callback(e,null);
    });
    viz_req.write(profile);
    viz_req.end();
  }
};

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);
// Start server
app.listen(port, host);
console.log('App started on port ' + port);

