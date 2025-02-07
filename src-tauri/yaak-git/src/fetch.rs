use crate::callbacks::default_callbacks;
use crate::error::Result;
use crate::repository::open_repo;
use git2::{FetchOptions, ProxyOptions, Repository};
use std::path::Path;

pub(crate) fn git_fetch_all(dir: &Path) -> Result<()> {
    let repo = open_repo(dir)?;
    let remotes = repo.remotes()?.iter().flatten().map(String::from).collect::<Vec<_>>();

    for (_idx, remote) in remotes.into_iter().enumerate() {
        fetch_from_remote(&repo, &remote)?;
    }

    Ok(())
}

fn fetch_from_remote(repo: &Repository, remote: &str) -> Result<()> {
    let mut remote = repo.find_remote(remote)?;

    let mut options = FetchOptions::new();
    let callbacks = default_callbacks();

    options.prune(git2::FetchPrune::On);
    let mut proxy = ProxyOptions::new();
    proxy.auto();

    options.proxy_options(proxy);
    options.download_tags(git2::AutotagOption::All);
    options.remote_callbacks(callbacks);

    remote.fetch(&[] as &[&str], Some(&mut options), None)?;
    // fetch tags (also removing remotely deleted ones)
    remote.fetch(&["refs/tags/*:refs/tags/*"], Some(&mut options), None)?;

    Ok(())
}
