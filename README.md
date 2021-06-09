# YASBIL: Yet Another Search Behaviour (and) Interaction Logger
This repository contains the code for the paper "YASBIL: Yet Another Search Behaviour (and) Interaction Logger" accepted at [SIGIR 2021 demo track](https://doi.org/10.1145/3404835.3462800).



## Download Links:
* [YASBIL Browser Extension](https://github.com/yasbil/yasbil/raw/main/yasbil-extn-2.0.0.xpi) (for user) tested with Firefox
* [YASBIL WordPress plugin](https://github.com/yasbil/yasbil/raw/main/yasbil-wp.zip) (for researcher) to be installed in central data repository


## Demo Video:
Screen recording of a typical research participant’s search session and
interaction with YASBIL (both browser extension and WordPress plugin).

[![YouTube Video: YASBIL Demo Screen Recording](./resources/yasbil-youtube-thumbnail.png)](http://www.youtube.com/watch?v=-sxQ2Xh_EPo "YASBIL Demo Screen Recording")

## Instructions to Use YASBIL
* [Instructions for Participants](./docs/instructions-participant.md)
* [Instructions for Researchers](./docs/instructions-researcher.md)

## Data Dictionary
A complete list of all the database tables used by YASBIL [can be found here](./docs/data-dictionary.md).

## Participant Management
Participant will be able to sync data to the server only if they are active 
(i.e. `yasbil_user_status` user meta field is not equal to the string `DISABLED`). 
This can be modified from the WordPress YASBIL-WP plugin interface.


## Citation
If you use YASBIL in your research, please cite YASBIL as
```
@inproceedings{bhattacharya2021yasbil,
  title={YASBIL: Yet Another Search Behaviour (and) Interaction Logger},
  author={Bhattacharya, Nilavra and Gwizdka, Jacek},
  booktitle={Proceedings of the 44th International ACM SIGIR Conference on Research and Development in Information Retrieval},
  year={2021},
  doi={10.1145/3404835.3462800},
  series={SIGIR '21}
}
```