extern crate diesel;
extern crate dotenv;
extern crate kuchiki;
extern crate server;
use dotenv::dotenv;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use kuchiki::traits::*;
use server::models::{Ad, get_targets, get_advertiser};
use server::start_logging;
use server::schema::ads::dsl::*;
use std::env;

fn main() {
    dotenv().ok();
    start_logging();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let conn = PgConnection::establish(&database_url).unwrap();
    let dbads: Vec<Ad> = ads.order(created_at.desc())
        .filter(targeting.is_not_null())
        .load::<Ad>(&conn)
        .unwrap();
    for ad in dbads {
        let document = kuchiki::parse_html().one(ad.html.clone());
        diesel::update(ads.find(ad.id))
            .set((
                targets.eq(get_targets(ad.targeting.clone())),
                advertiser.eq(
                    get_advertiser(ad.targeting.clone(), &document),
                ),
            ))
            .execute(&conn)
            .unwrap();
    }
}
