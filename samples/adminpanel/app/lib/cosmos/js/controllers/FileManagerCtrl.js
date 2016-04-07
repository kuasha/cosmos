/**
 * Created by maruf on 4/3/16.
 */

controllers.controller('FileManagerCtrl', ['$scope', '$modal', '$routeParams', 'CosmosService',
    function ($scope, $modal, $routeParams, CosmosService) {

        $scope.fileObjectName = $routeParams.fileObjectName;
        $scope.rootPath = "/gridfs/";

        $scope.init = function(rootPath){
            if(rootPath){
                $scope.rootPath = rootPath.trim();
                if(!$scope.rootPath.endsWith('/')){
                    $scope.rootPath = $scope.rootPath + '/';
                }
            }
            $scope.refresh();
        };

        $scope.refresh = function(){
            $scope.setAction();
            $scope.getFiles();
        };

        $scope.setAction = function() {
            document.uploadForm.action = $scope.rootPath + $scope.fileObjectName + "/";
        };

        $scope.clearError = function () {
            $scope.hasError = false;
            $scope.status = "";
            $scope.status_data = "";
        };

        $scope.processError = function (data, status) {
            $scope.hasError = true;
            $scope.status = status;
            $scope.status_data = JSON.stringify(data);
        };

        $scope.uploaded_files = [
        ];

        $scope.onFileUploadLoaded = function () {
            var responseText = this.contentDocument.body.innerText;

            if (responseText) {
                var values = JSON.parse(JSON.parse(responseText)._d);
                angular.forEach(values, function (data, index) {
                    $scope.uploaded_files.push(data);
                });
                $scope.$apply();
            }
            // Clear the iframe control
            $('#submit-iframe').remove();
            jQuery("#fileList").empty();
            jQuery("#fileList").append(jQuery('<input class="file-selector" name="uploadedfile" type="file" onchange="angular.element(this).scope().fileNameChanged()" />'));
        };

        $scope.uploadFile = function () {
            jQuery("#iFramePlaceholder").html("<iframe name='submit-iframe' id='submit-iframe' style='display: none;'></iframe>");

            jQuery("#submit-iframe").load($scope.onFileUploadLoaded);
            document.getElementById("uploadForm").submit();
        };

        $scope.fileNameChanged = function (fileInput) {
            var emptyFound = false;
            angular.forEach(jQuery("#fileList").children(), function (data, index) {
                if (!data.value) {
                    emptyFound = true;
                }
            });

            if (!emptyFound) {
                jQuery("#fileList").append(jQuery('<input class="file-selector" name="uploadedfile" type="file" onchange="angular.element(this).scope().fileNameChanged()" />'));
            }
        };

        $scope.removeFile = function (index) {
            var file = $scope.uploaded_files[index];
            if (confirm('Are you sure you want to delete the file ' + file.filename + '?')) {
                var file_id = file.file_id;
                CosmosService.delete($scope.rootPath + $scope.fileObjectName + '/' + file_id + '/', function (data) {
                        $scope.uploaded_files.splice(index, 1);
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

        $scope.getFiles = function () {
            if($scope.fileObjectName) {
                CosmosService.get($scope.rootPath + $scope.fileObjectName + '/', function (data) {
                        $scope.uploaded_files = data;
                    },
                    function (data, status) {
                        $scope.processError(data, status);
                    }
                );
            }
        };

    }]);