import { LemonTable, LemonTableColumn, LemonTag, Link, Tooltip } from '@posthog/lemon-ui'
import { useActions, useValues } from 'kea'
import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { More } from 'lib/lemon-ui/LemonButton/More'
import { LemonMenuOverlay } from 'lib/lemon-ui/LemonMenu/LemonMenu'
import { updatedAtColumn } from 'lib/lemon-ui/LemonTable/columnUtils'
import { LemonTableLink } from 'lib/lemon-ui/LemonTable/LemonTableLink'
import { urls } from 'scenes/urls'

import { AvailableFeature, PipelineNodeTab, PipelineStage, ProductKey } from '~/types'

import { AppMetricSparkLine } from './AppMetricSparkLine'
import { pipelineDestinationsLogic } from './destinationsLogic'
import { HogFunctionIcon } from './hogfunctions/HogFunctionIcon'
import { NewButton } from './NewButton'
import { pipelineAccessLogic } from './pipelineAccessLogic'
import { Destination } from './types'
import { pipelineNodeMenuCommonItems, RenderApp, RenderBatchExportIcon } from './utils'

export function Destinations(): JSX.Element {
    const { destinations, loading } = useValues(pipelineDestinationsLogic)

    return (
        <>
            <PayGateMini feature={AvailableFeature.DATA_PIPELINES}>
                <ProductIntroduction
                    productName="Pipeline destinations"
                    thingName="destination"
                    productKey={ProductKey.PIPELINE_DESTINATIONS}
                    description="Pipeline destinations allow you to export data outside of PostHog, such as webhooks to Slack."
                    docsURL="https://posthog.com/docs/cdp"
                    actionElementOverride={<NewButton stage={PipelineStage.Destination} />}
                    isEmpty={destinations.length === 0 && !loading}
                />
            </PayGateMini>
            <DestinationsTable />
        </>
    )
}

export function DestinationsTable({ inOverview = false }: { inOverview?: boolean }): JSX.Element {
    const { loading, destinations } = useValues(pipelineDestinationsLogic)
    const data = inOverview ? destinations.filter((destination) => destination.enabled) : destinations

    return (
        <>
            <LemonTable
                dataSource={data}
                size="small"
                loading={loading}
                columns={[
                    {
                        title: 'App',
                        width: 0,
                        render: function RenderAppInfo(_, destination) {
                            switch (destination.backend) {
                                case 'plugin':
                                    return <RenderApp plugin={destination.plugin} />
                                case 'hog_function':
                                    return <HogFunctionIcon src={destination.hog_function.icon_url} size="small" />
                                case 'batch_export':
                                    return <RenderBatchExportIcon type={destination.service.type} />
                                default:
                                    return null
                            }
                        },
                    },
                    {
                        title: 'Name',
                        sticky: true,
                        render: function RenderPluginName(_, destination) {
                            return (
                                <LemonTableLink
                                    to={urls.pipelineNode(
                                        PipelineStage.Destination,
                                        destination.id,
                                        PipelineNodeTab.Configuration
                                    )}
                                    title={
                                        <>
                                            <Tooltip title="Click to update configuration, view metrics, and more">
                                                <span>{destination.name}</span>
                                            </Tooltip>
                                        </>
                                    }
                                    description={destination.description}
                                />
                            )
                        },
                    },
                    {
                        title: 'Frequency',
                        render: function RenderFrequency(_, destination) {
                            return destination.interval
                        },
                    },
                    {
                        title: 'Weekly volume',
                        render: function RenderSuccessRate(_, destination) {
                            return (
                                <Link
                                    to={urls.pipelineNode(
                                        PipelineStage.Destination,
                                        destination.id,
                                        PipelineNodeTab.Metrics
                                    )}
                                >
                                    <AppMetricSparkLine pipelineNode={destination} />
                                </Link>
                            )
                        },
                    },
                    updatedAtColumn() as LemonTableColumn<Destination, any>,
                    {
                        title: 'Status',
                        render: function RenderStatus(_, destination) {
                            return (
                                <>
                                    {destination.enabled ? (
                                        <LemonTag type="success" className="uppercase">
                                            Active
                                        </LemonTag>
                                    ) : (
                                        <LemonTag type="default" className="uppercase">
                                            Paused
                                        </LemonTag>
                                    )}
                                </>
                            )
                        },
                    },
                    {
                        width: 0,
                        render: function Render(_, destination) {
                            return (
                                <More
                                    overlay={
                                        <DestinationMoreOverlay destination={destination} inOverview={inOverview} />
                                    }
                                />
                            )
                        },
                    },
                ]}
            />
        </>
    )
}

export const DestinationMoreOverlay = ({
    destination,
    inOverview = false,
}: {
    destination: Destination
    inOverview?: boolean
}): JSX.Element => {
    const { canConfigurePlugins, canEnableNewDestinations } = useValues(pipelineAccessLogic)
    const { toggleNode, deleteNode } = useActions(pipelineDestinationsLogic)

    return (
        <LemonMenuOverlay
            items={[
                {
                    label: destination.enabled ? 'Pause destination' : 'Unpause destination',
                    onClick: () => toggleNode(destination, !destination.enabled),
                    disabledReason: !canConfigurePlugins
                        ? 'You do not have permission to toggle destinations.'
                        : !canEnableNewDestinations && !destination.enabled
                        ? 'Data pipelines add-on is required for enabling new destinations'
                        : undefined,
                },
                ...pipelineNodeMenuCommonItems(destination),
                ...(!inOverview
                    ? [
                          {
                              label: 'Delete destination',
                              status: 'danger' as const, // for typechecker happiness
                              onClick: () => deleteNode(destination),
                              disabledReason: canConfigurePlugins
                                  ? undefined
                                  : 'You do not have permission to delete destinations.',
                          },
                      ]
                    : []),
            ]}
        />
    )
}
