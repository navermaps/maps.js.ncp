(function() {
    if (!window.app) {
        window.app = {};
    };

    app.POSITIONS = {
        navercorp: new naver.maps.LatLng(37.3595963, 127.1054328),
        navercorpPanorama: new naver.maps.LatLng(37.3599605, 127.1058814),
        linecorp: new naver.maps.LatLng(37.3849483, 127.1229117),
        seoulCityHall: new naver.maps.LatLng(37.5666103, 126.9783882),
        sungsu: new naver.maps.LatLng(37.5452352,127.0452413)
    };
    app.boot = function(mapEl, panoramaEl) {
        var map = new naver.maps.Map(mapEl, {
            center: app.POSITIONS.navercorp,
            zoom: 11,
            scrollWheel: false,
            zoomControl: true,
            mapTypeControl: true
        });

        var panorama = new naver.maps.Panorama(panoramaEl, {
            position: app.POSITIONS.navercorpPanorama,
            pov: {
                pan: -135,
                tilt: 35,
                fov: 100
            },
            zoomControl: true,
            aroundControl: true
        });

        app.map = map;
        app.panorama = panorama;

        window.map = map;
        window.panorama = panorama;

        var mapContainer = map.getElement().parentNode,
            panoContainer = panorama.getElement().parentNode,
            size = map.getSize().clone(),
            resizeTimer = null;

        window.onresize = function() {
            window.clearTimeout(resizeTimer);

            resizeTimer = window.setTimeout(function() {
                size.width = mapContainer.offsetWidth;
                size.height = mapContainer.offsetHeight;

                map.setSize(size.clone());
                panorama.setSize(size.clone());
            }, 0);
        };

        app.Animation.start();
    };

    app.Animation = {
        timer: null,
        speed: 1,
        _actions: [],
        push: function(action, duration, delay) {
            this._actions.push({
                body: action,
                delay: delay || 0,
                duration: duration || 0
            });
        },
        start: function() {
            var _this = this;

            _this._currentActions = this._actions.slice(0);

            this._process();
        },

        stop: function() {
            window.clearTimeout(this.timer);
            delete this.timer;
        },

        restart: function() {
            this.stop();

            var _this = this;

            window.clearTimeout(this._restartTimer);
            this._restartTimer = window.setTimeout(function() {
                _this.start();
            }, 5000 / this.speed);
        },

        _process: function() {
            if (this._currentActions.length === 0) {
                this.restart();
                return;
            }

            var _this = this,
                action = this._currentActions.shift(),
                delay = (action.delay || 0) / this.speed,
                duration = (action.duration || 0) / this.speed,
                body = action.body || function() {};

            _this.timer = window.setTimeout(function() {
                body();

                _this.timer = window.setTimeout(function() {
                    _this._process();
                }, duration)
            }, delay);
        }
    };

    var marker = null,
        lineMarker_b,
        lineMarker_s,
        polygon;

// duration, delay

    var polygonOuterPath = [
            new naver.maps.LatLng(37.37544345085402, 127.11224555969238),
            new naver.maps.LatLng(37.37230584065902, 127.10791110992432),
            new naver.maps.LatLng(37.35975408751081, 127.10795402526855),
            new naver.maps.LatLng(37.359924641705476, 127.11576461791992),
            new naver.maps.LatLng(37.35931064479073, 127.12211608886719),
            new naver.maps.LatLng(37.36043630196386, 127.12293148040771),
            new naver.maps.LatLng(37.36354029942161, 127.12310314178465),
            new naver.maps.LatLng(37.365211629488016, 127.12456226348876),
            new naver.maps.LatLng(37.37544345085402, 127.11224555969238)],
        polygonInnerPath = [
            new naver.maps.LatLng(37.368485964153784, 127.10971355438232),
            new naver.maps.LatLng(37.368520071054576, 127.11464881896971),
            new naver.maps.LatLng(37.36350619025713, 127.11473464965819),
            new naver.maps.LatLng(37.363403862670665, 127.1097993850708),
            new naver.maps.LatLng(37.368485964153784, 127.10971355438232)
        ],
        polygonPaths = polygonOuterPath.concat(polygonInnerPath);

    app.Animation.push(
        function() {
            marker = new naver.maps.Marker({
                position: app.POSITIONS.navercorp,
                map: map,
                animation: naver.maps.Animation.DROP,
                icon: "./docs/img/marker-default.png",
                shadow: null
            });
        }, 700, 1000);

    app.Animation.push(
        function() {
            marker.setAnimation(naver.maps.Animation.BOUNCE);
        }, 1020);

    app.Animation.push(
        function() {
            marker.setAnimation(null);
        }, 500);

    app.Animation.push(
        function() {
            map.panToBounds(new naver.maps.LatLngBounds(
                new naver.maps.LatLng(37.3518385, 127.0929359),
                new naver.maps.LatLng(37.3808233, 127.1360721)))
        }, 1200);

    app.Animation.push(
        function() {
            polygon = new naver.maps.Polygon({
                map: map,
                paths: [
                    [polygonOuterPath[0]],
                    []
                ],
                fillColor: '#ff0000',
                fillOpacity: 0.3,
                strokeColor: '#ff0000',
                strokeOpacity: 0.6,
                strokeWeight: 3
            });
        }, 200);

    for (var i=1, ii=polygonPaths.length; i<ii; i++) {
        app.Animation.push(
            function(head) {
                if (head < polygonOuterPath.length) {
                    return function() {
                        polygon.getPaths().getAt(0).push(polygonPaths[head]);
                    };
                } else {
                    return function() {
                        polygon.getPaths().getAt(1).push(polygonPaths[head]);
                    };
                }
            }(i), 100);
    }

    app.Animation.push(
        function() {
            map.panTo(app.POSITIONS.linecorp, {duration: 800});
        }, 500, 400);

    app.Animation.push(
        function() {
            map.morph(app.POSITIONS.linecorp, 13, {duration: 1500});
        }, 1500, 400);

   app.Animation.push(
        function() {
            lineMarker_b = new naver.maps.Marker({
                map: map,
                position: app.POSITIONS.linecorp.destinationPoint(90, 10),
                icon: {
                    content: '<div style="position:absolute;left:0;top:0;width:120px;background-color:#F2F0EA;text-align:center;border:2px solid #6C483B;">' +
                        '<img src="./docs/img/example/brown.png" style="width: 120px; height:130px">' +
                        '<span style="font-weight: bold;"> Brown </span>' +
                        '</div>',
                    size: new naver.maps.Size(120, 134),
                    anchor: new naver.maps.Point(0, 0)
                }
            });
        }, 200, 200);

    app.Animation.push(
        function() {
            lineMarker_s = new naver.maps.Marker({
                map: map,
                position: app.POSITIONS.linecorp.destinationPoint(45, 40),
                icon: {
                    content: '<div style="position:absolute;left:0;top:0;width:50px;">' +
                        '<img src="./docs/img/example/sally.png" style="width: 50px;">' +
                        '</div>',
                    size: new naver.maps.Size(50, 52),
                    anchor: new naver.maps.Point(0, 0)
                }
            });
        }, 1000);

    app.Animation.push(
        function() {
            lineMarker_b.setMap(null);
            lineMarker_s.setMap(null);
            marker.setMap(null);
            polygon.setMap(null);
        });

    app.Animation.push(
        function() {
            map.morph(app.POSITIONS.linecorp, 8, {duration: 1000, easing: 'easeInCubic'});
        }, 1500);

    app.Animation.push(
        function() {
            map.setMapTypeId(naver.maps.MapTypeId.SATELLITE);
        }, 800);

    app.Animation.push(
        function() {
            map.panTo(app.POSITIONS.seoulCityHall.destinationPoint(180, 1500), {
                duration: 4000 / app.Animation.speed
            });
        }, 4000);

    app.Animation.push(
        function() {
            map.setMapTypeId(naver.maps.MapTypeId.HYBRID);
        }, 800);

    app.Animation.push(
        function() {
            map.setMapTypeId(naver.maps.MapTypeId.TERRAIN);
        }, 800);

    app.Animation.push(
        function() {
            map.setMapTypeId(naver.maps.MapTypeId.NORMAL);
        }, 800);

    app.Animation.push(
        function() {
            map.morph(app.POSITIONS.sungsu, 10, {duration: 2000});
        }, 2000, 500);

    app.Animation.push(
        function() {
            var layer = new naver.maps.CadastralLayer();
            layer.setMap(map);
        }, 800);
    app.Animation.push(
        function() {
            map.cadastralLayer.setMap(null);
            var layer = new naver.maps.TrafficLayer();
            layer.setMap(map);
        }, 800);

    app.Animation.push(
        function() {
            map.trafficLayer.setMap(null);
            var layer = new naver.maps.BicycleLayer();
            layer.setMap(map);
        }, 800);
    app.Animation.push(
        function() {
            map.bicycleLayer.setMap(null);
            var layer = new naver.maps.StreetLayer();
            layer.setMap(map);
        }, 800);

    app.Animation.push(
        function() {
            map.streetLayer.setMap(null);
        }, 200);

    app.Animation.push(
        function() {
            map.morph(app.POSITIONS.navercorp, 3, {duration: 2000});
        }, 2000);

    app.Animation.push(
        function() {
            map.morph(app.POSITIONS.navercorp, 11, {duration: 1000});
        }, 2000);
})();
