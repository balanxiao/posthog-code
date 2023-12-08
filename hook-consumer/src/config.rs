use std::str::FromStr;
use std::time;

use envconfig::Envconfig;

#[derive(Envconfig, Clone)]
pub struct Config {
    #[envconfig(default = "postgres://posthog:posthog@localhost:15432/test_database")]
    pub database_url: String,

    #[envconfig(default = "consumer")]
    pub consumer_name: String,

    #[envconfig(default = "default")]
    pub queue_name: String,

    #[envconfig(default = "100")]
    pub poll_interval: EnvMsDuration,

    #[envconfig(default = "5000")]
    pub request_timeout: EnvMsDuration,

    #[envconfig(default = "1024")]
    pub max_concurrent_jobs: usize,

    #[envconfig(nested = true)]
    pub retry_policy: RetryPolicyConfig,

    #[envconfig(default = "job_queue")]
    pub table_name: String,
}

#[derive(Debug, Clone, Copy)]
pub struct EnvMsDuration(pub time::Duration);

#[derive(Debug, PartialEq, Eq)]
pub struct ParseEnvMsDurationError;

impl FromStr for EnvMsDuration {
    type Err = ParseEnvMsDurationError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let ms = s.parse::<u64>().map_err(|_| ParseEnvMsDurationError)?;

        Ok(EnvMsDuration(time::Duration::from_millis(ms)))
    }
}

#[derive(Envconfig, Clone)]
pub struct RetryPolicyConfig {
    #[envconfig(default = "2")]
    pub backoff_coefficient: u32,

    #[envconfig(default = "1000")]
    pub initial_interval: EnvMsDuration,

    #[envconfig(default = "100000")]
    pub maximum_interval: EnvMsDuration,
}
