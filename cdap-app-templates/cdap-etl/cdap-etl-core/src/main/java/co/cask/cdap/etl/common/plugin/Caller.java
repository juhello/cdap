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

package co.cask.cdap.etl.common.plugin;

import com.google.common.base.Throwables;

import java.util.concurrent.Callable;

/**
 * Calls a callable. Used to perform some extra logic around a callable.
 */
public abstract class Caller {
  public static final Caller DEFAULT = new Caller() {
    @Override
    public <T> T call(Callable<T> callable) throws Exception {
      return callable.call();
    }
  };

  public abstract <T> T call(Callable<T> callable) throws Exception;

  public <T> T callUnchecked(Callable<T> callable) {
    try {
      return call(callable);
    } catch (Exception e) {
      throw Throwables.propagate(e);
    }
  }
}
