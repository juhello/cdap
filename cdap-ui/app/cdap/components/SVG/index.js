/*
 * Copyright © 2017 Cask Data, Inc.
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

import React, {PropTypes} from 'react';
import classnames from 'classnames';
require('./SVG.scss');

const pathToSvgSprite = '/cdap_assets/fonts/symbol-defs.svg';

export default function SVG({icon, className, onClick}) {
  let path = pathToSvgSprite + `#${icon}`;
  return (
    <svg
      className={classnames('icon-svg', className)}
      onClick={onClick}
    >
      <use xlinkHref={path} />
    </svg>
  );
}

SVG.propTypes = {
  icon: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func
};
