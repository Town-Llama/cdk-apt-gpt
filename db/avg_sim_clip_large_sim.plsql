CREATE OR REPLACE FUNCTION public.search_properties_with_clip_large_embeddings(min_rent numeric, max_rent numeric, bedrooms integer, input_lat numeric, input_lng numeric, max_distance numeric, embedding_vector vector)
 RETURNS TABLE(unit_id character varying, property_id character varying, property_ts timestamp without time zone, available boolean, name text, baths numeric, beds integer, area integer, ts timestamp without time zone, rent_12_month_monthly numeric, rent_11_month_monthly numeric, rent_10_month_monthly numeric, rent_9_month_monthly numeric, rent_8_month_monthly numeric, rent_7_month_monthly numeric, rent_6_month_monthly numeric, rent_5_month_monthly numeric, rent_4_month_monthly numeric, rent_3_month_monthly numeric, rent_2_month_monthly numeric, rent_1_month_monthly numeric, property_timestamp timestamp without time zone, addressstreet character varying, addresscity character varying, addressstate character varying, addresszipcode character varying, latitude numeric, longitude numeric, photosarray text, description text, transitscore integer, transitdescription text, walkscore integer, walkdescription text, buildingname character varying, distance double precision, embedding_similarity numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH filtered_units AS (
       SELECT u.id AS unit_id, u.property_id, u.property_ts, u.available, u.name, u.baths, u.beds, u.area, u.ts,
              u.rent_12_month_monthly, u.rent_11_month_monthly, u.rent_10_month_monthly, u.rent_9_month_monthly,
              u.rent_8_month_monthly, u.rent_7_month_monthly, u.rent_6_month_monthly, u.rent_5_month_monthly,
              u.rent_4_month_monthly, u.rent_3_month_monthly, u.rent_2_month_monthly, u.rent_1_month_monthly,
              p.timestamp AS property_timestamp, p.addressStreet, p.addressCity, p.addressState, p.addressZipCode,
              p.latitude, p.longitude, p.photosArray, p.description, p.transitScore, p.transitDescription,
              p.walkScore, p.walkDescription, p.buildingName,
              calculate_distance(p.latitude, p.longitude, input_lat, input_lng) AS distance
       FROM Unit u
       JOIN Properties p ON u.property_id = p.id AND u.property_ts = p.timestamp
       WHERE u.rent_12_month_monthly BETWEEN min_rent AND max_rent
       AND u.beds = bedrooms
       AND calculate_distance(p.latitude, p.longitude, input_lat, input_lng) < max_distance
       ),
    ranked_distances AS (
       SELECT fu.*, ph.id AS photo_id,
              cosine_distance(e.data, embedding_vector) AS cosine_dist,
              ROW_NUMBER() OVER (PARTITION BY fu.unit_id ORDER BY cosine_distance(e.data, embedding_vector) ASC) AS rn
       FROM filtered_units fu
       JOIN Photos ph ON fu.property_id = ph.entityid
       JOIN clip_embeddings_large e ON ph.id = e.photo_id
       ),
    top_2_distances AS (
       SELECT * FROM ranked_distances
       WHERE rn <= 2
       )
    SELECT top2.unit_id, top2.property_id, top2.property_ts, top2.available, top2.name, top2.baths, top2.beds, top2.area, top2.ts,
       top2.rent_12_month_monthly, top2.rent_11_month_monthly, top2.rent_10_month_monthly, top2.rent_9_month_monthly,
       top2.rent_8_month_monthly, top2.rent_7_month_monthly, top2.rent_6_month_monthly, top2.rent_5_month_monthly,
       top2.rent_4_month_monthly, top2.rent_3_month_monthly, top2.rent_2_month_monthly, top2.rent_1_month_monthly,
       top2.property_timestamp, top2.addressStreet, top2.addressCity, top2.addressState, top2.addressZipCode,
       top2.latitude, top2.longitude, top2.photosArray, top2.description, top2.transitScore, top2.transitDescription,
       top2.walkScore, top2.walkDescription, top2.buildingName, top2.distance,
       AVG(cosine_dist::DECIMAL(9, 6)) AS embedding_similarity
    FROM top_2_distances top2
    GROUP BY top2.unit_id, top2.property_id, top2.property_ts, top2.available, top2.name, top2.baths, top2.beds, top2.area, top2.ts,
       top2.rent_12_month_monthly, top2.rent_11_month_monthly, top2.rent_10_month_monthly, top2.rent_9_month_monthly,
       top2.rent_8_month_monthly, top2.rent_7_month_monthly, top2.rent_6_month_monthly, top2.rent_5_month_monthly,
       top2.rent_4_month_monthly, top2.rent_3_month_monthly, top2.rent_2_month_monthly, top2.rent_1_month_monthly,
       top2.property_timestamp, top2.addressStreet, top2.addressCity, top2.addressState, top2.addressZipCode,
       top2.latitude, top2.longitude, top2.photosArray, top2.description, top2.transitScore, top2.transitDescription,
       top2.walkScore, top2.walkDescription, top2.buildingName, top2.distance
    ORDER BY embedding_similarity ASC
    LIMIT 200;
END;
$function$
;

CREATE INDEX IF NOT EXISTS idx_unit_rent_beds ON Unit (rent_12_month_monthly, beds);
CREATE INDEX IF NOT EXISTS idx_properties_location ON Properties (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_photos_entityid ON Photos (entityid);
CREATE INDEX IF NOT EXISTS idx_clip_embeddings_photo_id ON clip_embeddings_large (photo_id);