'use strict';

angular.module('registryApp')
    .controller('BuildCtrl', ['$scope', '$routeParams', '$interval', '$document', '$timeout', 'Build', 'Header', function ($scope, $routeParams, $interval, $document, $timeout, Build, Header) {

        var logIntervalId;
        var scrollTimeoutId;

        Header.setActive('builds');

        $scope.view = {};
        $scope.view.loading = true;
        $scope.view.build = null;

        /* get the build details */
        Build.getBuild($routeParams.id).then(function(result) {

            $scope.view.build = result;

            $scope.view.log = [];
            $scope.view.contentLength = 0;


            /* start lo(n)g polling if build is running */
            if (result.status === 'running') {

                console.log('lo(n)g polling started');

                $scope.view.loading = false;

                logIntervalId = $interval(function() {
                    Build.getLog($routeParams.id, $scope.view.contentLength).then(logLoaded);
                }, 2000);

            } else {
                /* other than that take the log for the current build */
                Build.getLog($routeParams.id, 0).then(function(result) {
                    $scope.view.loading = false;
                    $scope.view.log = $scope.view.log.concat(result.content.split('\n'));
                });
            }
        });

        /**
         * Callback when log for the build is loaded
         *
         * @param result
         */
        var logLoaded = function(result) {

            if (result.status !== 'running') {
                $scope.stopLogInterval();
            }

            $scope.view.build.status = result.status;

            if (result.contentLength > 0) {
                $scope.view.log = $scope.view.log.concat(result.content.split('\n'));
                $scope.view.contentLength += parseInt(result.contentLength, 10);
                console.log('lo(n)g polling at ', $scope.view.contentLength);

                $scope.stopScrollTimeout();

                var logContainer = $document[0].getElementById('log-content');
                scrollTimeoutId = $timeout(function () {
                    logContainer.scrollTop = logContainer.scrollHeight;
                }, 100);
            }

        };

        /**
         * Stop the lo(n)g polling
         */
        $scope.stopLogInterval = function() {
            if (angular.isDefined(logIntervalId)) {
                $interval.cancel(logIntervalId);
                logIntervalId = undefined;
                console.log('lo(n)g polling canceled');
            }
        };


        /**
         * Stop the scroll timeout
         */
        $scope.stopScrollTimeout = function() {
            if (angular.isDefined(scrollTimeoutId)) {
                $timeout.cancel(scrollTimeoutId);
                scrollTimeoutId = undefined;
            }
        };

        $scope.$on('$destroy', function() {
            $scope.stopLogInterval();
            $scope.stopScrollTimeout();
        });


    }]);
