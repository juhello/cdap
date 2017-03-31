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

package co.cask.cdap.etl.spark.plugin;

import co.cask.cdap.api.metrics.Metrics;
import co.cask.cdap.api.plugin.PluginContext;
import co.cask.cdap.etl.api.batch.SparkCompute;
import co.cask.cdap.etl.api.batch.SparkSink;
import co.cask.cdap.etl.api.streaming.StreamingSource;
import co.cask.cdap.etl.api.streaming.Windower;
import co.cask.cdap.etl.common.plugin.Caller;
import co.cask.cdap.etl.common.plugin.ClassLoaderCaller;
import co.cask.cdap.etl.common.plugin.PipelinePluginContext;
import co.cask.cdap.etl.common.plugin.StageLoggingCaller;

/**
 * Wraps spark specific plugin types.
 */
public class SparkPipelinePluginContext extends PipelinePluginContext {

  public SparkPipelinePluginContext(PluginContext delegate, Metrics metrics) {
    super(delegate, metrics);
  }

  @SuppressWarnings("unchecked")
  @Override
  protected Object wrapUnknownPlugin(String pluginId, Object plugin) {
    if (plugin instanceof Windower) {
      return new WrappedWindower((Windower) plugin, getTimedCaller(pluginId, plugin));
    } else if (plugin instanceof SparkCompute) {
      return new WrappedSparkCompute<>((SparkCompute) plugin, getUntimedCaller(pluginId, plugin));
    } else if (plugin instanceof SparkSink) {
      return new WrappedSparkSink<>((SparkSink) plugin, getUntimedCaller(pluginId, plugin));
    } else if (plugin instanceof StreamingSource) {
      return new WrappedStreamingSource<>((StreamingSource) plugin, getUntimedCaller(pluginId, plugin));
    }

    return plugin;
  }

  // don't time the methods for sparkcompute, sparksink, or streamingsource since all of their methods
  // run in the spark driver and are not an accurate number for how long things take.
  private Caller getUntimedCaller(String pluginId, Object plugin) {
    return ClassLoaderCaller.wrap(
      StageLoggingCaller.wrap(Caller.DEFAULT, pluginId), plugin.getClass().getClassLoader());
  }
}
