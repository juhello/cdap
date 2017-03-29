/*
 * Copyright © 2016-2017 Cask Data, Inc.
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

import React, {Component, PropTypes} from 'react';
import SVG from 'components/SVG';
import T from 'i18n-react';
require('./EntityCardHeader.scss');
import classnames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import {getType} from 'services/metadata-parser';

export default class EntityCardHeader extends Component {
  constructor(props) {
    super(props);
  }

  getEntityType() {
    return getType(this.props.entity);
  }

  render() {
    return (
      <div className="card-header-wrapper">
        {
          !isEmpty(this.props.successMessage) ?
            (
              <div className="entity-card-header success-message">
                <h4>
                  <span>
                    {
                      this.props.successMessage
                    }
                  </span>
                </h4>
              </div>
            )
          :
            (
              <div
                onClick={this.props.onClick}
                className={classnames("entity-card-header", this.props.className)}
              >
                <h4>
                  <SVG
                    className="entity-icon"
                    icon={this.props.entity.icon}
                  />
                  <span className="entity-type">
                    {T.translate(`commons.entity.${this.getEntityType()}.singular`)}
                  </span>
                </h4>
              </div>
            )
        }
      </div>
    );
  }
}

EntityCardHeader.defaultProps = {
  systemTags: []
};

EntityCardHeader.propTypes = {
  entity: PropTypes.object,
  systemTags: PropTypes.array,
  className: PropTypes.string,
  onClick: PropTypes.func,
  successMessage: PropTypes.string
};
