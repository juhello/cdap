/*
 * Copyright © 2015-2017 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

class HydratorPlusPlusTopPanelCtrl {
  constructor($stateParams, HydratorPlusPlusConfigStore, HydratorPlusPlusConfigActions, $uibModal, HydratorPlusPlusConsoleActions, DAGPlusPlusNodesActionsFactory, GLOBALS, myHelpers, HydratorPlusPlusConsoleStore, myPipelineExportModalService, $timeout, $scope, HydratorPlusPlusPreviewStore, HydratorPlusPlusPreviewActions, $interval, myPipelineApi, $state, MyCDAPDataSource, myAlertOnValium, MY_CONFIG, PREVIEWSTORE_ACTIONS, $q, NonStorePipelineErrorFactory, rArtifacts,  $window) {
    this.consoleStore = HydratorPlusPlusConsoleStore;
    this.myPipelineExportModalService = myPipelineExportModalService;
    this.HydratorPlusPlusConfigStore = HydratorPlusPlusConfigStore;
    this.GLOBALS = GLOBALS;
    this.HydratorPlusPlusConfigActions = HydratorPlusPlusConfigActions;
    this.$uibModal = $uibModal;
    this.HydratorPlusPlusConsoleActions = HydratorPlusPlusConsoleActions;
    this.DAGPlusPlusNodesActionsFactory = DAGPlusPlusNodesActionsFactory;
    this.parsedDescription = this.HydratorPlusPlusConfigStore.getDescription();
    this.myHelpers = myHelpers;
    this.$timeout = $timeout;
    this.PREVIEWSTORE_ACTIONS = PREVIEWSTORE_ACTIONS;
    this.previewStore = HydratorPlusPlusPreviewStore;
    this.previewActions = HydratorPlusPlusPreviewActions;
    this.$interval = $interval;
    this.myPipelineApi = myPipelineApi;
    this.$state = $state;
    this.dataSrc = new MyCDAPDataSource($scope);
    this.myAlertOnValium = myAlertOnValium;
    this.currentPreviewId = null;
    this.$window = $window;
    this.showRunTimeArguments = false;
    this.viewLogs = false;
    this.$q = $q;
    this.NonStorePipelineErrorFactory = NonStorePipelineErrorFactory;
    this.artifacts = rArtifacts;
    // This is for now run time arguments. It will be a map of macroMap
    // in the future once we get list of macros for a pipeline config.
    this.macrosMap = {};
    this.$stateParams = $stateParams;
    this.setState();
    this.HydratorPlusPlusConfigStore.registerOnChangeListener(this.setState.bind(this));
    this.focusTimeout = null;
    this.timeoutInMinutes = 15;

    if ($stateParams.isClone) {
      this.openMetadata();
    }

    this.currentDraftId = this.HydratorPlusPlusConfigStore.getDraftId();
    if (this.currentDraftId && this.currentDraftId === this.$window.localStorage.getItem('LastDraftId')) {
      this.currentPreviewId = this.$window.localStorage.getItem('LastPreviewId');
    }

    this.isPreviewEnabled = angular.isObject(MY_CONFIG.hydrator) &&
                            MY_CONFIG.hydrator.previewEnabled === true;

    this.previewMode = false;
    this.previewStartTime = null;
    this.displayDuration = {
      minutes: '--',
      seconds: '--'
    };
    this.previewTimerInterval = null;
    this.previewLoading = false;
    this.previewRunning = false;

    let unsub = this.previewStore.subscribe(() => {
      let state = this.previewStore.getState().preview;
      this.previewMode = state.isPreviewModeEnabled;
    });

    $scope.$on('$destroy', () => {
      unsub();
      this.stopPreview();
      this.$interval.cancel(this.previewTimerInterval);
      this.$timeout.cancel(this.focusTimeout);
      this.previewStore.dispatch({ type: this.PREVIEWSTORE_ACTIONS.PREVIEW_RESET });
    });

    // have to add this event handler because the $destroy event here
    // is not triggered on page refresh
    this.$window.onbeforeunload = function() {
      $scope.$destroy();
    };
  }

  setMetadata(metadata) {
    this.state.metadata = metadata;
  }
  setState() {
    this.state = {
      metadata: {
        name: this.HydratorPlusPlusConfigStore.getName(),
        description: this.HydratorPlusPlusConfigStore.getDescription()
      },
      viewSettings: this.myHelpers.objectQuery(this.state, 'viewSettings') || false,
      artifact: this.HydratorPlusPlusConfigStore.getArtifact()
    };
  }

  openMetadata() {
    this.metadataExpanded = true;
    this.invalidName = false;

    this.$timeout.cancel(this.focusTimeout);
    this.focusTimeout = this.$timeout(() => {
      document.getElementById('pipeline-name-input').focus();
    });
  }
  resetMetadata(event) {
    this.setState();
    this.metadataExpanded = false;
    event.preventDefault();
    event.stopPropagation();
  }
  saveMetadata(event) {
    this.HydratorPlusPlusConfigActions.setMetadataInfo(this.state.metadata.name, this.state.metadata.description);
    if (this.state.metadata.description) {
      this.parsedDescription = this.state.metadata.description.replace(/\n/g, ' ');
      this.tooltipDescription = this.state.metadata.description.replace(/\n/g, '<br />');
    } else {
      this.parsedDescription = '';
      this.tooltipDescription = '';
    }
    this.metadataExpanded = false;
    event.preventDefault();
    event.stopPropagation();
  }
  onEnterOnMetadata(event) {
    // Save when user hits ENTER key.
    if (event.keyCode === 13) {
      this.saveMetadata(event);
      this.metadataExpanded = false;
    } else if (event.keyCode === 27) {
      // Reset if the user hits ESC key.
      this.resetMetadata();
    }
  }

  onImport() {
    let fileBrowserClickCB = () => {
      document.getElementById('pipeline-import-config-link').click();
    };
    // This is not using the promise pattern as browsers NEED to have the click on the call stack to generate the click on input[type=file] button programmatically in like line:115.
    // When done in promise we go into the promise ticks and the then callback is called in the next tick which prevents the browser to open the file dialog
    // as a file dialog is opened ONLY when manually clicked by the user OR transferring the click to another button in the same call stack
    // TL;DR Can't open file dialog programmatically. If we need to, we need to transfer the click from a user on a button directly into the input file dialog button.
    this._checkAndShowConfirmationModalOnDirtyState(fileBrowserClickCB);
  }

  onExport() {
    this.DAGPlusPlusNodesActionsFactory.resetSelectedNode();
    let config = angular.copy(this.HydratorPlusPlusConfigStore.getDisplayConfig());
    let exportConfig = this.HydratorPlusPlusConfigStore.getConfigForExport();
    delete exportConfig.__ui__;
    this.myPipelineExportModalService.show(config, exportConfig);
  }
  onSaveDraft() {
    this.HydratorPlusPlusConfigActions.saveAsDraft();
    this.checkNameError();
    this.$window.localStorage.setItem('LastDraftId', this.HydratorPlusPlusConfigStore.getDraftId());
    this.$window.localStorage.setItem('LastPreviewId', this.currentPreviewId);
  }
  checkNameError() {
    let messages = this.consoleStore.getMessages() || [];
    let filteredMessages = messages.filter( message => {
      return ['MISSING-NAME', 'INVALID-NAME'].indexOf(message.type) !== -1;
    });

    this.invalidName = (filteredMessages.length ? true : false);
  }
  onValidate() {
    this.HydratorPlusPlusConsoleActions.resetMessages();
    let isStateValid = this.HydratorPlusPlusConfigStore.validateState(true);
    if (isStateValid) {
      this.HydratorPlusPlusConsoleActions.addMessage([{
        type: 'success',
        content: 'Validation success! Pipeline ' + this.HydratorPlusPlusConfigStore.getName() + ' is valid.'
      }]);
      return;
    }
    this.checkNameError();
  }
  onPublish() {
    this.HydratorPlusPlusConfigActions.publishPipeline();
    this.checkNameError();
  }
  showSettings() {
    this.state.viewSettings = !this.state.viewSettings;
  }

  // PREVIEW
  startTimer() {
    this.previewTimerInterval = this.$interval(() => {
      let duration = (new Date() - this.previewStartTime) / 1000;
      duration = duration >= 0 ? duration : 0;

      let minutes = Math.floor(duration / 60);
      let seconds = Math.floor(duration % 60);
      seconds = seconds < 10 ? '0' + seconds : seconds;
      minutes = minutes < 10 ? '0' + minutes : minutes;

      this.displayDuration = {
        minutes: minutes,
        seconds: seconds
      };
    }, 500);
  }
  stopTimer() {
    this.$interval.cancel(this.previewTimerInterval);
  }

  toggleRuntimeArguments() {
    if (!this.previewRunning) {
      this.showRunTimeArguments = !this.showRunTimeArguments;
    } else {
      this.stopPreview();
    }
  }
  runPreview() {
    this.previewLoading = true;
    this.loadingLabel = 'Starting';
    this.showRunTimeArguments = false;

    this.displayDuration = {
      minutes: '--',
      seconds: '--'
    };

    let params = {
      namespace: this.$state.params.namespace,
      scope: this.$scope
    };

    // GENERATING PREVIEW CONFIG
    // This might/should be extracted out to a factory

    let pipelineConfig = this.HydratorPlusPlusConfigStore.getConfigForExport();
    /**
     *  This is a cheat way for generating preview for the entire pipeline
     **/

    let previewConfig = {
      startStages: [],
      endStages: [],
      runtimeArgs: this.macrosMap
    };

    if (this.state.artifact.name === this.GLOBALS.etlDataPipeline) {
      pipelineConfig.preview = Object.assign({}, previewConfig, {
        'realDatasets' :[],
        'programName' : 'DataPipelineWorkflow',
        'programType': 'Workflow'
      });
    } else if (this.state.artifact.name === this.GLOBALS.etlDataStreams) {
      pipelineConfig.preview = Object.assign({}, previewConfig, {
        'realDatasets' :[],
        'programName' : 'DataStreamsSparkStreaming',
        'programType': 'Spark',
        'timeout': this.timeoutInMinutes
      });
    }
    // Get start stages and end stages
    // Current implementation:
    //    - start stages mean sources
    //    - end stages mean sinks
    angular.forEach(pipelineConfig.config.stages, (node) => {
      if (this.GLOBALS.pluginConvert[node.plugin.type] === 'source') {
        previewConfig.startStages.push(node.name);
      } else if (this.GLOBALS.pluginConvert[node.plugin.type] === 'sink') {
        previewConfig.endStages.push(node.name);
      }
    });
    pipelineConfig.config.preview = previewConfig;

    if (previewConfig.startStages.length === 0 || previewConfig.endStages.length === 0) {
      this.myAlertOnValium.show({
        type: 'danger',
        content: this.GLOBALS.en.hydrator.studio.error.PREVIEW['NO-SOURCE-SINK']
      });
      this.previewLoading = false;
      return;
    }

    this.myPipelineApi.runPreview(params, pipelineConfig).$promise
      .then((res) => {
        this.previewStore.dispatch(
          this.previewActions.setPreviewId(res.application)
        );
        let startTime = new Date();
        this.previewStartTime = startTime;
        this.startTimer();
        this.previewStore.dispatch(
          this.previewActions.setPreviewStartTime(startTime)
        );
        this.currentPreviewId = res.application;
        this.$window.localStorage.setItem('LastDraftId', this.HydratorPlusPlusConfigStore.getDraftId());
        this.$window.localStorage.setItem('LastPreviewId', this.currentPreviewId);
        this.startPollPreviewStatus(res.application);
      }, (err) => {
        this.previewLoading = false;
        this.myAlertOnValium.show({
          type: 'danger',
          content: err.data
        });
      });
  }

  stopPreview() {
    if (!this.currentPreviewId) {
      return;
    }
    let params = {
      namespace: this.$state.params.namespace,
      scope: this.$scope,
      previewId: this.currentPreviewId
    };
    this.previewLoading = true;
    this.loadingLabel = 'Stopping';
    this.stopTimer();
    this.myPipelineApi
        .stopPreview(params, {})
        .$promise
        .then(() => {
          this.previewLoading = false;
          this.previewRunning = false;
        });
  }

  startPollPreviewStatus(previewId) {
    this.previewLoading = false;
    this.previewRunning = true;
    let poll = this.dataSrc.poll({
      _cdapNsPath: '/previews/' + previewId + '/status',
      interval: 5000
    }, (res) => {
      if (res.status !== 'RUNNING' || res.status !== 'STARTED') {
        this.stopTimer();
        this.previewRunning = false;
        this.dataSrc.stopPoll(res.__pollId__);
        let pipelineName = this.HydratorPlusPlusConfigStore.getName();
        let pipelinePreviewPlaceholder = pipelineName.length > 0 ? `Preview of pipeline "${pipelineName}"` : 'Pipeline preview';
        if (res.status === 'COMPLETED') {
          this.myAlertOnValium.show({
            type: 'success',
            content: `${pipelinePreviewPlaceholder} is finished.`
          });
        } else if (res.status === 'STOPPED' || res.status === 'KILLED') {
          this.myAlertOnValium.show({
            type: 'success',
            content: `${pipelinePreviewPlaceholder} was stopped successfully.`
          });
        } else {
          this.myAlertOnValium.show({
            type: 'danger',
            content: `${pipelinePreviewPlaceholder} failed. Please check logs for more information.`
          });
        }
      }
    }, (err) => {
      this.stopTimer();
        this.myAlertOnValium.show({
          type: 'danger',
          content: 'Pipeline preview failed : ' + err
        });
      this.previewRunning = false;
      this.dataSrc.stopPoll(poll.__pollId__);
    });
  }

  togglePreviewMode() {
    this.previewStore.dispatch(
      this.previewActions.togglePreviewMode(!this.previewMode)
    );
  }

  importFile(files) {
    if (files[0].name.indexOf('.json') === -1) {
      this.myAlertOnValium.show({
        type: 'danger',
        content: 'Pipeline configuration should be JSON.'
      });
      return;
    }
    let generateLinearConnections = (config) => {
      let nodes = config.stages;
      let connections = [];
      let i;

      for (i=0; i<nodes.length - 1 ; i++) {
        connections.push({ from: nodes[i].name, to: nodes[i+1].name });
      }
      return connections;
    };

    let isValidArtifact = (importArtifact) => {
      let isVersionExists = [];
      let isScopeExists = [];
      let isNameExists = this.artifacts.filter( artifact => artifact.name === importArtifact.name );
      isVersionExists = isNameExists.filter( artifact => artifact.version === importArtifact.version );
      isScopeExists = isNameExists.filter( artifact => artifact.scope.toUpperCase() === importArtifact.scope.toUpperCase() );
      return {
        name: isNameExists.length > 0,
        version: isVersionExists.length > 0,
        scope: isScopeExists.length > 0
      };
    };

    var reader = new FileReader();
    reader.readAsText(files[0], 'UTF-8');

    reader.onload =  (evt) => {
      var data = evt.target.result;
      var jsonData;
      try {
        jsonData = JSON.parse(data);
      } catch(e) {
        this.myAlertOnValium.show({
          type: 'danger',
          content: 'Syntax Error. Ill-formed pipeline configuration.'
        });
        return;
      }

      let isNotValid = this.NonStorePipelineErrorFactory.validateImportJSON(jsonData);

      if (isNotValid) {
        this.myAlertOnValium.show({
          type: 'danger',
          content: isNotValid
        });
        return;
      }

      if (!jsonData.config.connections) {
        jsonData.config.connections = generateLinearConnections(jsonData.config);
      }

      let validArtifact = isValidArtifact(jsonData.artifact);
      if (!validArtifact.name || !validArtifact.version || !validArtifact.scope) {
        let invalidFields = [];
        if (!validArtifact.name) {
          invalidFields.push('Artifact name');
        } else {
          if (!validArtifact.version) {
            invalidFields.push('Artifact version');
          }
          if (!validArtifact.scope) {
            invalidFields.push('Artifact scope');
          }
        }
        invalidFields = invalidFields.length === 1 ? invalidFields[0] : invalidFields.join(', ');
        this.myAlertOnValium.show({
          type: 'danger',
          content: `Imported pipeline has invalid artifact information: ${invalidFields}.`
        });
      } else {
        if (!jsonData.config.connections) {
          jsonData.config.connections = generateLinearConnections(jsonData.config);
        }
        this.HydratorPlusPlusConfigStore.setState(this.HydratorPlusPlusConfigStore.getDefaults());
        this.$state.go('hydrator.create', { data: jsonData });
      }
    };
  }

  _checkAndShowConfirmationModalOnDirtyState(proceedCb) {
    let goTonextStep = true;
    let isStoreDirty = this.HydratorPlusPlusConfigStore.getIsStateDirty();
    if (isStoreDirty) {
      return this.$uibModal.open({
          templateUrl: '/assets/features/hydrator/templates/create/popovers/canvas-overwrite-confirmation.html',
          size: 'lg',
          backdrop: 'static',
          keyboard: false,
          windowTopClass: 'confirm-modal hydrator-modal center',
          controller: ['$scope', 'HydratorPlusPlusConfigStore', 'HydratorPlusPlusConfigActions', function($scope, HydratorPlusPlusConfigStore, HydratorPlusPlusConfigActions) {
            $scope.isSaving = false;
            $scope.discard = () => {
              goTonextStep = true;
              if (proceedCb) {
                proceedCb();
              }
              $scope.$close();
            };
            $scope.save = () => {
              let pipelineName = HydratorPlusPlusConfigStore.getName();
              if (!pipelineName.length) {
                HydratorPlusPlusConfigActions.saveAsDraft();
                goTonextStep = false;
                $scope.$close();
                return;
              }
              var unsub = HydratorPlusPlusConfigStore.registerOnChangeListener( () => {
                let isStateDirty = HydratorPlusPlusConfigStore.getIsStateDirty();
                // This is solely used for showing the spinner icon until the modal is closed.
                if(!isStateDirty) {
                  unsub();
                  goTonextStep = true;
                  $scope.$close();
                }
              });
              HydratorPlusPlusConfigActions.saveAsDraft();
              $scope.isSaving = true;
            };
            $scope.cancel = () => {
              $scope.$close();
              goTonextStep = false;
            };
          }]
        })
        .closed
        .then(() => {
          return goTonextStep;
        });
    } else {
      if (proceedCb) {
        proceedCb();
      }
      return this.$q.when(goTonextStep);
    }
  }
}

HydratorPlusPlusTopPanelCtrl.$inject = ['$stateParams', 'HydratorPlusPlusConfigStore', 'HydratorPlusPlusConfigActions', '$uibModal', 'HydratorPlusPlusConsoleActions', 'DAGPlusPlusNodesActionsFactory', 'GLOBALS', 'myHelpers', 'HydratorPlusPlusConsoleStore', 'myPipelineExportModalService', '$timeout', '$scope', 'HydratorPlusPlusPreviewStore', 'HydratorPlusPlusPreviewActions', '$interval', 'myPipelineApi', '$state', 'MyCDAPDataSource', 'myAlertOnValium', 'MY_CONFIG', 'PREVIEWSTORE_ACTIONS', '$q', 'NonStorePipelineErrorFactory', 'rArtifacts', '$window'];
angular.module(PKG.name + '.feature.hydrator')
  .controller('HydratorPlusPlusTopPanelCtrl', HydratorPlusPlusTopPanelCtrl);
