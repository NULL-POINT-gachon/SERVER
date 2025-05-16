class HotPlaceDto {
    constructor(id, name, description, image, category, latitude, longitude) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.image = image;
      this.category = category;
      this.latitude = latitude;
      this.longitude = longitude;
    } 

    static toDto(place){
        return new HotPlaceDto(place.id, place.destination_name, place.destination_description, place.image, place.category, place.latitude, place.longitude);
    }
}

module.exports = {
  HotPlaceDto
};