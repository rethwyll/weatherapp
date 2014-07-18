(function(){
  $.support.cors = true;
  window.weather = {};
  window.weather.Models = {};
  window.weather.Views = {};
  window.weather.Routers = {};

  window.weather.Models.mToday = Backbone.Model.extend();
  window.weather.Models.mThisWeek = Backbone.Model.extend();

  window.weather.Routers.rRouter = Backbone.Router.extend({
    routes: {
      'search/:city': 'fetch',
      '*path': 'defaultRoute'
    },

    defaultRoute: function() {
      this.fetch('Seattle')
    },

    fetch: function(city) {
      $.ajax({
        url: 'http://api.openweathermap.org/data/2.5/forecast/daily?q=' + city + '&mode=xml&units=metric&cnt=7&APPID=c0a41d39c9326bce8aa120a7572e77b4',       
        dataType: 'xml',
        error: function(jqxr,textstatus,errorthrown) {
          window.weather.today.model.set({
            data: false
          });
          window.weather.thisweek.model.set({
            data: [],
            hasData: false
          });            
        },
        success: function(resp) {
          var input_val = ''
          if (typeof resp == 'string' && resp.search('cod') > -1) {
            window.weather.today.model.set({
              data: false
            });
            window.weather.thisweek.model.set({
              data: [],
              hasData: false
            });   
          }          
          else {
            var getValues = function (options) {
              time = options.time
              var data = {}

              data.date_string = moment(time.getAttribute('day')).format(options.today ? 'ddd, MMMM Do' : 'ddd');
              temperature = time.getElementsByTagName('temperature')[0];
              data.high = Math.floor((temperature.getAttribute('max') * (180/100)) + 32);
              data.low = Math.floor((temperature.getAttribute('min') * (180/100)) + 32);

              forecast = matchForecast(time.getElementsByTagName('clouds')[0].getAttribute('value'));
              data.klass = forecast.klass

              if (options.today) {
                data.forecast = forecast.txt
                data.humidity = time.getElementsByTagName('humidity')[0].getAttribute('value');
              }

              return data
            };

            var matchForecast = function (forecast) {
              var CONDITION_MAP = {
                'scattered clouds': { klass: 'cloudy-light', txt: 'Light Clouds'},
                'overcast clouds': { klass: 'cloudy', txt: 'Cloudy' },
                'clear sky': { klass: 'sunny', txt: 'Sunny' },
                'few clouds': { klass: 'sunny-mostly', txt: 'Mostly Sunny' },
                'scattered clouds': { klass: 'sunny-partly', txt: 'Partly Sunny' },
                'fog': { klass: 'fog', txt: 'Fog' },
                'hail': { klass: 'hail', txt: 'Hail' },
                'rain': { klass: 'rain', txt: 'Rain' },
                'light rain': { klass: 'rain-light', txt: 'Light Rain' },
                'drizzle': { klass: 'rain-showers', txt: 'Rain Showers' },
                'light intensity drizzle': { klass: 'rain-showers-light', txt: 'Light Rain Showers' },
                'snow': { klass: 'snow', txt: 'Snow' },
                'light snow': { klass: 'snow-light', txt: 'Light Snow' },
                'thunderstorm with rain': { klass: 'thunderstorm', txt: 'Thunderstorm' },
                'ragged thunderstorm': { klass: 'lightning', txt: 'lightning' },
                'light thunderstorm': { klass: 'thunder', txt: 'thunder' }
              }
              
              if (CONDITION_MAP.hasOwnProperty(forecast)) {
                return CONDITION_MAP[forecast];
              }
              else if (forecast.search(/rain/) > -1) {
                return CONDITION_MAP['rain'];
              }
              else if (forecast.search(/snow/) > -1) {
                return CONDITION_MAP['snow'];
              }
              else if (forecast.search(/thunderstorm/) > -1) {
                return CONDITION_MAP['thunderstorm with light rain'];
              }
              else if (forecast.search(/clouds/) > -1) {
                return CONDITION_MAP['few clouds'];
              }
              else {
                return CONDITION_MAP['few clouds'];
              }
            };

            var times = resp.getElementsByTagName('time');
            var today = times[0];
            window.weather.today.model.set({
              data: getValues({ time: today, today: true })
            });

            var data = []
            for (var i=1, l=times.length; i<5; i++) {
              var time = times[i];
              data.push(getValues({ time: time, today: false }));
            } 
            window.weather.thisweek.model.set({
              data: data,
              hasData: data.length > 0
            });

            input_val = city
          }
          $(window.weather.search.input_el).val(input_val);
        } 
      });
    }
  });

  window.weather.Views.vSearch = Backbone.View.extend({
    el: $('#search'),
    input_el: $('#search-input'),

    events: {
      'change': 'search',
      'submit': 'search'
    },

    search: function(e){
      e.preventDefault();
      window.weather.router.navigate('search/' + $(this.input_el).val(), {trigger: true})
    }

  });

  window.weather.Views.vToday = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this, 'render');      
      this.model.bind('change', this.render);      
    },

    render: function(){
      $(this.el).html(Mustache.render($('#template-today').html(), this.model.toJSON()));
      $(this.el).find('.container').fadeIn();      
    }
  });

  window.weather.Views.vThisWeek = Backbone.View.extend({
    initialize: function(){
      _.bindAll(this, 'render');            
      this.model.bind('change', this.render);      
    },

    render: function(){
      $(this.el).html(Mustache.render($('#template-thisweek').html(), this.model.toJSON()));
      $(this.el).find('.container').fadeIn();
    }
  });

  window.weather.today = new window.weather.Views.vToday({
    el: $('#today'),
    model: new window.weather.Models.mToday
  })

  window.weather.thisweek = new window.weather.Views.vThisWeek({
    el: $('#this-week'),
    model: new window.weather.Models.mThisWeek
  })

  window.weather.search = new window.weather.Views.vSearch
  window.weather.router = new window.weather.Routers.rRouter
  Backbone.history.start()  

})();